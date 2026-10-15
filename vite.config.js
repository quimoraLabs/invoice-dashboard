import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.CLERK_SECRET_KEY = env.CLERK_SECRET_KEY
  process.env.FIREBASE_SERVICE_ACCOUNT = env.FIREBASE_SERVICE_ACCOUNT

  return {
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', '@clerk/react'],
    },
    plugins: [
      react(),
      tailwindcss(),
      visualizer(),
      {
        name: 'api-server-middleware',
        configureServer(server) {
          // 1. /api/create-firebase-token
          server.middlewares.use('/api/create-firebase-token', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ error: 'Method Not Allowed' }))
            }

            let body = ''
            req.on('data', (chunk) => (body += chunk))
            req.on('end', async () => {
              try {
                const { clerkToken, workspaceId: requestedWorkspaceId, userEmail, displayName } = JSON.parse(body || '{}')

                if (!clerkToken) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  return res.end(JSON.stringify({ error: 'Missing clerkToken' }))
                }

                const { verifyToken } = await import('@clerk/backend')
                const { initializeApp, getApps, cert } = await import('firebase-admin/app')
                const { getAuth } = await import('firebase-admin/auth')
                const { getFirestore } = await import('firebase-admin/firestore')

                if (!getApps().length) {
                  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
                  if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT')
                  const sa = raw.trim().startsWith('{')
                    ? JSON.parse(raw)
                    : JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
                  initializeApp({ credential: cert(sa) })
                }

                const verified = await verifyToken(clerkToken, {
                  secretKey: process.env.CLERK_SECRET_KEY,
                })

                const userId = verified.sub
                const emailFromClaims = verified?.email || verified?.primary_email_address || verified?.email_address
                const effectiveEmail = (emailFromClaims || userEmail || '').toLowerCase().trim()

                const customClaims = {}
                let resolvedWorkspaceId = null
                let resolvedRole = null

                const tokenWorkspaceId = verified?.workspaceId || verified?.orgId
                const tokenRole = verified?.role

                if (tokenWorkspaceId && typeof tokenWorkspaceId === 'string') {
                  resolvedWorkspaceId = tokenWorkspaceId
                  resolvedRole = typeof tokenRole === 'string' ? tokenRole : 'accountant'
                }

                try {
                  const adminDb = getFirestore()

                  // Auto-join pending invites for this email
                  if (effectiveEmail) {
                    const pendingInvitesSnap = await adminDb
                      .collection('workspace_invites')
                      .where('invitedEmail', '==', effectiveEmail)
                      .where('status', '==', 'pending')
                      .get()

                    if (!pendingInvitesSnap.empty) {
                      const batch = adminDb.batch()
                      for (const inviteDoc of pendingInvitesSnap.docs) {
                        const inviteData = inviteDoc.data() || {}
                        const memberDocRef = adminDb
                          .collection('workspace_members')
                          .doc(`${inviteData.workspaceId}_${userId}`)

                        batch.set(
                          memberDocRef,
                          {
                            workspaceId: inviteData.workspaceId,
                            userId,
                            email: effectiveEmail,
                            displayName: displayName || effectiveEmail.split('@')[0],
                            role: inviteData.role || 'accountant',
                            joinedAt: new Date(),
                          },
                          { merge: true }
                        )

                        batch.update(inviteDoc.ref, {
                          status: 'accepted',
                          acceptedAt: new Date(),
                          acceptedBy: userId,
                        })

                        if (!resolvedWorkspaceId) {
                          resolvedWorkspaceId = inviteData.workspaceId
                          resolvedRole = inviteData.role || 'accountant'
                        }
                      }
                      await batch.commit()
                    }
                  }

                  if (requestedWorkspaceId && typeof requestedWorkspaceId === 'string') {
                    const memberDoc = await adminDb
                      .collection('workspace_members')
                      .doc(`${requestedWorkspaceId}_${userId}`)
                      .get()

                    if (memberDoc.exists) {
                      const data = memberDoc.data() || {}
                      resolvedWorkspaceId = requestedWorkspaceId
                      resolvedRole = data.role || 'accountant'
                    }
                  } else if (!resolvedWorkspaceId) {
                    const membershipSnap = await adminDb
                      .collection('workspace_members')
                      .where('userId', '==', userId)
                      .limit(1)
                      .get()

                    if (!membershipSnap.empty) {
                      const firstDoc = membershipSnap.docs[0].data() || {}
                      resolvedWorkspaceId = firstDoc.workspaceId
                      resolvedRole = firstDoc.role || 'accountant'
                    }
                  }
                } catch (dbErr) {
                  console.warn('[api/create-firebase-token] Firestore member lookup warning:', dbErr.message)
                }

                if (resolvedWorkspaceId) {
                  customClaims.workspaceId = resolvedWorkspaceId
                  if (resolvedRole) {
                    customClaims.role = resolvedRole
                  }
                }

                const firebaseToken = Object.keys(customClaims).length > 0
                  ? await getAuth().createCustomToken(userId, customClaims)
                  : await getAuth().createCustomToken(userId)

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ firebaseToken, claims: customClaims }))
              } catch (error) {
                console.error('[api/create-firebase-token] ERROR:', error.message)
                res.statusCode = 401
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Authentication exchange failed' }))
              }
            })
          })

          // 2. /api/accept-invite
          server.middlewares.use('/api/accept-invite', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ error: 'Method Not Allowed' }))
            }

            let body = ''
            req.on('data', (chunk) => (body += chunk))
            req.on('end', async () => {
              try {
                const { clerkToken, inviteId, userEmail, displayName } = JSON.parse(body || '{}')

                if (!clerkToken) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  return res.end(JSON.stringify({ error: 'Missing clerkToken' }))
                }

                const { verifyToken } = await import('@clerk/backend')
                const { initializeApp, getApps, cert } = await import('firebase-admin/app')
                const { getFirestore } = await import('firebase-admin/firestore')

                if (!getApps().length) {
                  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
                  if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT')
                  const sa = raw.trim().startsWith('{')
                    ? JSON.parse(raw)
                    : JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
                  initializeApp({ credential: cert(sa) })
                }

                const verified = await verifyToken(clerkToken, {
                  secretKey: process.env.CLERK_SECRET_KEY,
                })

                const userId = verified.sub
                const emailFromClaims = verified?.email || verified?.primary_email_address || verified?.email_address
                const effectiveEmail = (emailFromClaims || userEmail || '').toLowerCase().trim()

                const adminDb = getFirestore()
                let acceptedCount = 0
                const acceptedWorkspaces = []

                if (inviteId) {
                  const inviteRef = adminDb.collection('workspace_invites').doc(inviteId)
                  const inviteSnap = await inviteRef.get()

                  if (!inviteSnap.exists) {
                    res.statusCode = 404
                    res.setHeader('Content-Type', 'application/json')
                    return res.end(JSON.stringify({ error: 'Invite not found' }))
                  }

                  const inviteData = inviteSnap.data() || {}
                  if (inviteData.status !== 'pending') {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    return res.end(JSON.stringify({ error: `Invite is already ${inviteData.status}` }))
                  }

                  const memberDocRef = adminDb.collection('workspace_members').doc(`${inviteData.workspaceId}_${userId}`)
                  const batch = adminDb.batch()

                  batch.set(
                    memberDocRef,
                    {
                      workspaceId: inviteData.workspaceId,
                      userId,
                      email: effectiveEmail || inviteData.invitedEmail || '',
                      displayName: displayName || (effectiveEmail ? effectiveEmail.split('@')[0] : 'Team Member'),
                      role: inviteData.role || 'accountant',
                      joinedAt: new Date(),
                    },
                    { merge: true }
                  )

                  batch.update(inviteRef, {
                    status: 'accepted',
                    acceptedAt: new Date(),
                    acceptedBy: userId,
                  })

                  await batch.commit()
                  acceptedCount = 1
                  acceptedWorkspaces.push({ workspaceId: inviteData.workspaceId, role: inviteData.role || 'accountant' })
                } else if (effectiveEmail) {
                  const invitesSnap = await adminDb
                    .collection('workspace_invites')
                    .where('invitedEmail', '==', effectiveEmail)
                    .where('status', '==', 'pending')
                    .get()

                  if (!invitesSnap.empty) {
                    const batch = adminDb.batch()
                    for (const doc of invitesSnap.docs) {
                      const invite = doc.data() || {}
                      const memberDocRef = adminDb.collection('workspace_members').doc(`${invite.workspaceId}_${userId}`)

                      batch.set(
                        memberDocRef,
                        {
                          workspaceId: invite.workspaceId,
                          userId,
                          email: effectiveEmail,
                          displayName: displayName || effectiveEmail.split('@')[0],
                          role: invite.role || 'accountant',
                          joinedAt: new Date(),
                        },
                        { merge: true }
                      )

                      batch.update(doc.ref, {
                        status: 'accepted',
                        acceptedAt: new Date(),
                        acceptedBy: userId,
                      })

                      acceptedCount++
                      acceptedWorkspaces.push({ workspaceId: invite.workspaceId, role: invite.role || 'accountant' })
                    }
                    await batch.commit()
                  }
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, acceptedCount, acceptedWorkspaces }))
              } catch (error) {
                console.error('[api/accept-invite] ERROR:', error.message)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: error.message }))
              }
            })
          })
        },
      },
    ],
  }
})