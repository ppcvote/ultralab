import { useState, useEffect } from 'react'

interface LiveStats {
  totalPosts: number
  totalFollowers: number
  totalAccounts: number
  loading: boolean
}

// Hardcoded fallback — updated periodically so the site never shows stale zeros
const FALLBACK: Omit<LiveStats, 'loading'> = {
  totalPosts: 1065,
  totalFollowers: 11942,
  totalAccounts: 19,
}

// Module-level cache so multiple components share one fetch
let cachedStats: Omit<LiveStats, 'loading'> | null = null
let fetchPromise: Promise<Omit<LiveStats, 'loading'>> | null = null

async function fetchStats(): Promise<Omit<LiveStats, 'loading'>> {
  if (cachedStats) return cachedStats

  if (!fetchPromise) {
    fetchPromise = fetch('/api/live-stats')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        cachedStats = {
          totalPosts: data.totalPosts || FALLBACK.totalPosts,
          totalFollowers: data.totalFollowers || FALLBACK.totalFollowers,
          totalAccounts: data.totalAccounts || FALLBACK.totalAccounts,
        }
        return cachedStats
      })
      .catch(() => {
        cachedStats = FALLBACK
        return FALLBACK
      })
  }

  return fetchPromise
}

/**
 * Fetches live MindThread stats from /api/live-stats.
 * Returns cached data if already fetched. Falls back to hardcoded values on error.
 */
export function useLiveStats(): LiveStats {
  const [stats, setStats] = useState<Omit<LiveStats, 'loading'>>(cachedStats || FALLBACK)
  const [loading, setLoading] = useState(!cachedStats)

  useEffect(() => {
    if (cachedStats) {
      setStats(cachedStats)
      setLoading(false)
      return
    }

    fetchStats().then((s) => {
      setStats(s)
      setLoading(false)
    })
  }, [])

  return { ...stats, loading }
}
