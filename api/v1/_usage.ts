import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateApiKey } from '../_api-auth.js'
import { getAdminDb } from '../_firebase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Extract API key
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header',
      message: 'Use: Authorization: Bearer up_live_YOUR_API_KEY',
    })
  }

  const apiKey = authHeader.replace('Bearer ', '')

  // Validate API key
  const validation = await validateApiKey(apiKey)
  if (!validation.valid) {
    return res.status(401).json({ error: validation.error })
  }

  const { tier, monthlyLimit } = validation.keyData!

  try {
    const db = getAdminDb()
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Get current month usage
    const usageRef = db.collection('api_usage').doc(apiKey).collection('monthly').doc(currentMonth)
    const usageDoc = await usageRef.get()

    const currentUsage = usageDoc.exists ? (usageDoc.data()?.scans || 0) : 0
    const lastScan = usageDoc.exists ? usageDoc.data()?.lastScan?.toDate() : null

    // Get last 6 months history
    const history: any[] = []
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      const monthUsageRef = db.collection('api_usage').doc(apiKey).collection('monthly').doc(month)
      const monthDoc = await monthUsageRef.get()

      history.push({
        month,
        scans: monthDoc.exists ? (monthDoc.data()?.scans || 0) : 0,
      })
    }

    return res.status(200).json({
      ok: true,
      tier,
      limit: monthlyLimit,
      currentMonth: {
        month: currentMonth,
        scans: currentUsage,
        remaining: monthlyLimit ? Math.max(0, monthlyLimit - currentUsage) : null,
        lastScan,
      },
      history: history.reverse(),
    })
  } catch (err) {
    console.error('Usage query error:', err)
    return res.status(500).json({ error: 'Failed to retrieve usage data' })
  }
}
