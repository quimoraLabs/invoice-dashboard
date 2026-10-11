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
        name: 'api-create-firebase-token',
        configureServer(server) {
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
        },
      },
    ],
  }
})