import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getVulnerabilityStats } from '../_vuln-collector.js'

/**
 * Admin endpoint to get vulnerability statistics
 *
 * Usage:
 *   GET /api/admin/vuln-stats?days=30&secret=ADMIN_SECRET
 *
 * Returns:
 *   - Total scans in last N days
 *   - Average grade and score
 *   - Top 10 vulnerabilities
 *   - Severity distribution
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple auth via query param (for internal use only)
  const { secret, days } = req.query

  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const daysNum = days ? parseInt(days as string, 10) : 30
    const stats = await getVulnerabilityStats(daysNum)

    return res.status(200).json({
      ok: true,
      period: `Last ${daysNum} days`,
      stats,
    })
  } catch (err) {
    console.error('Vuln stats error:', err)
    return res.status(500).json({ error: 'Failed to retrieve stats' })
  }
}
