import type { VercelRequest, VercelResponse } from '@vercel/node'
import admin from 'firebase-admin'

/**
 * Public endpoint: GET /api/live-stats
 *
 * Returns MindThread platform stats (post count, followers, accounts).
 * Cached via Vercel Edge for 5 minutes to avoid hammering Firestore.
 *
 * Response:
 *   { totalPosts, totalFollowers, totalAccounts, updatedAt }
 */

const MT_APP_NAME = 'mindthread-stats'

function getMindThreadDb() {
  const existing = admin.apps.find((a) => a?.name === MT_APP_NAME)
  if (existing) return admin.firestore(existing)

  const projectId = process.env.MT_FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.MT_FIREBASE_CLIENT_EMAIL?.trim()
  let privateKey = process.env.MT_FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing MindThread Firebase credentials (MT_FIREBASE_*)')
  }

  // Handle escaped \\n from Vercel env
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }
  privateKey = privateKey.trim()

  const app = admin.initializeApp(
    { credential: admin.credential.cert({ projectId, clientEmail, privateKey }) },
    MT_APP_NAME
  )

  return admin.firestore(app)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Cache for 5 minutes at Vercel edge, 1 minute stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const db = getMindThreadDb()

    // Parallel queries
    const [postsAgg, accountsSnap] = await Promise.all([
      db.collection('posts').where('status', '==', 'published').count().get(),
      db.collection('accounts').get(),
    ])

    const totalPosts = postsAgg.data().count
    let totalFollowers = 0
    let totalAccounts = 0

    accountsSnap.forEach((doc) => {
      const d = doc.data()
      // Only count accounts with active tokens
      if (d.threadsAccessToken || d.accessToken) {
        totalAccounts++
        totalFollowers += d.followersCount || d.followers_count || 0
      }
    })

    return res.status(200).json({
      totalPosts,
      totalFollowers,
      totalAccounts,
      updatedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    console.error('live-stats error:', err instanceof Error ? err.message : err)
    // Return hardcoded fallback so the site never shows 0
    return res.status(200).json({
      totalPosts: 1065,
      totalFollowers: 11942,
      totalAccounts: 19,
      updatedAt: null,
      fallback: true,
    })
  }
}
