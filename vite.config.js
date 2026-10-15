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
                const { clerkToken, workspaceId: requestedWorkspaceId } = JSON.parse(body || '{}')

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

          // 2. /api/my-invites
          server.middlewares.use('/api/my-invites', async (req, res) => {
            let body = ''
            req.on('data', (chunk) => (body += chunk))
            req.on('end', async () => {
              try {
                let clerkToken = null
                const authHeader = req.headers.authorization || req.headers.Authorization
                if (authHeader && authHeader.startsWith('Bearer ')) {
                  clerkToken = authHeader.substring(7)
                }

                if (!clerkToken && body) {
                  try {
                    const parsed = JSON.parse(body)
                    clerkToken = parsed.clerkToken
                  } catch {
                    clerkToken = null
                  }
                }

                if (!clerkToken && req.url && req.url.includes('clerkToken=')) {
                  const urlObj = new URL(req.url, 'http://localhost')
                  clerkToken = urlObj.searchParams.get('clerkToken')
                }

                if (!clerkToken) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  return res.end(JSON.stringify({ error: 'Missing Clerk token' }))
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

                const emailFromClaims = verified?.email || verified?.primary_email_address || verified?.email_address
                const effectiveEmail = (emailFromClaims || '').toLowerCase().trim()

                if (!effectiveEmail) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  return res.end(JSON.stringify({ invites: [] }))
                }

                const adminDb = getFirestore()
                const invitesSnap = await adminDb
                  .collection('workspace_invites')
                  .where('invitedEmail', '==', effectiveEmail)
                  .where('status', '==', 'pending')
                  .get()

                const invites = []
                for (const doc of invitesSnap.docs) {
                  const data = doc.data() || {}
                  let workspaceName = data.workspaceName || 'Business Workspace'
                  if (!data.workspaceName && data.workspaceId) {
                    try {
                      const wsSnap = await adminDb.collection('workspaces').doc(data.workspaceId).get()
                      if (wsSnap.exists) {
                        workspaceName = wsSnap.data()?.name || workspaceName
                      }
                    } catch {
                      workspaceName = 'Business Workspace'
                    }
                  }

                  invites.push({
                    id: doc.id,
                    workspaceId: data.workspaceId,
                    workspaceName,
                    invitedEmail: data.invitedEmail,
                    role: data.role || 'accountant',
                    invitedBy: data.invitedBy || '',
                    createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : null,
                  })
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ invites }))
              } catch (error) {
                console.error('[api/my-invites] ERROR:', error.message)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: error.message }))
              }
            })
          })

          // 3. /api/accept-invite
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
                const {
                  clerkToken,
                  inviteId,
                  passcode,
                  action = 'accept',
                  userEmail,
                  displayName,
                } = JSON.parse(body || '{}')

                if (!clerkToken) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  return res.end(JSON.stringify({ error: 'Missing clerkToken' }))
                }

                if (!inviteId) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  return res.end(JSON.stringify({ error: 'Missing inviteId' }))
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

                if (
                  inviteData.invitedEmail &&
                  effectiveEmail &&
                  inviteData.invitedEmail.toLowerCase().trim() !== effectiveEmail
                ) {
                  res.statusCode = 403
                  res.setHeader('Content-Type', 'application/json')
                  return res.end(JSON.stringify({ error: 'This invitation was sent to a different email address.' }))
                }

                // Handle DECLINE
                if (action === 'decline') {
                  await inviteRef.update({
                    status: 'declined',
                    declinedAt: new Date(),
                    declinedBy: userId,
                  })

                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  return res.end(JSON.stringify({ success: true, action: 'declined' }))
                }

                // Handle ACCEPT with Passcode
                const wsRef = adminDb.collection('workspaces').doc(inviteData.workspaceId)
                const wsSnap = await wsRef.get()

                if (!wsSnap.exists) {
                  res.statusCode = 404
                  res.setHeader('Content-Type', 'application/json')
                  return res.end(JSON.stringify({ error: 'Target workspace no longer exists.' }))
                }

                const wsData = wsSnap.data() || {}
                if (wsData.invitePasscode) {
                  const provided = String(passcode || '').trim()
                  if (!provided || provided !== String(wsData.invitePasscode).trim()) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    return res.end(JSON.stringify({
                      error: 'Invalid 6-digit security passcode. Please ask the workspace owner for the correct passcode to join.',
                    }))
                  }
                }

                const memberDocRef = adminDb.collection('workspace_members').doc(`${inviteData.workspaceId}_${userId}`)
                const resolvedName = displayName || (effectiveEmail ? effectiveEmail.split('@')[0] : 'Team Member')

                const batch = adminDb.batch()

                batch.set(
                  memberDocRef,
                  {
                    workspaceId: inviteData.workspaceId,
                    userId,
                    email: effectiveEmail || inviteData.invitedEmail || '',
                    displayName: resolvedName,
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

                // Audit log entry
                const logDocRef = adminDb.collection('activity_logs').doc()
                batch.set(logDocRef, {
                  workspaceId: inviteData.workspaceId,
                  actorUid: userId,
                  actorName: resolvedName,
                  actorEmail: effectiveEmail || '',
                  action: 'member_join',
                  entityType: 'member',
                  entityId: userId,
                  entityTitle: resolvedName,
                  details: `${resolvedName} accepted the invitation and joined as ${inviteData.role || 'accountant'}.`,
                  createdAt: new Date(),
                })

                await batch.commit()

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  action: 'accepted',
                  workspaceId: inviteData.workspaceId,
                  workspaceName: wsData.name || inviteData.workspaceName || 'Business Workspace',
                  role: inviteData.role || 'accountant',
                }))
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