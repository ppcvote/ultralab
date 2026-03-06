import { useState, useEffect } from 'react'

/* ── Types ── */
interface AgentStats {
  status: string
  posts: number
  upvotes: number
  comments: number
  lastAction: string
  lastActionAt: string
}

interface AgentEvent {
  t: string
  agent: string
  action: string
  detail: string
}

interface FleetStats {
  postsTotal: number
  commentsTotal: number
  upvotesTotal: number
  errors: number
  uptime: string
}

export interface AgentActivity {
  agents: Record<string, AgentStats>
  events: AgentEvent[]
  stats: FleetStats
  loading: boolean
}

/* ── Fallback (used when Firestore doc doesn't exist yet) ── */
const FALLBACK: Omit<AgentActivity, 'loading'> = {
  agents: {
    main:  { status: 'active', posts: 4, upvotes: 14, comments: 3, lastAction: 'Drafting post...', lastActionAt: '' },
    mind:  { status: 'active', posts: 3, upvotes: 14, comments: 6, lastAction: 'Queue staged...', lastActionAt: '' },
    probe: { status: 'active', posts: 4, upvotes: 10, comments: 4, lastAction: 'Scanning LLM...', lastActionAt: '' },
    adv:   { status: 'active', posts: 0, upvotes: 0,  comments: 0, lastAction: 'Portfolio planning...', lastActionAt: '' },
  },
  events: [
    { t: '15:12', agent: 'main',  action: 'POST',   detail: 'Keeping AI Agents Alive in Production' },
    { t: '14:57', agent: 'mind',  action: 'POST',   detail: 'Reclaim Your Threads' },
    { t: '14:06', agent: 'main',  action: 'ENGAGE', detail: 'Commented on trending post' },
    { t: '13:58', agent: 'probe', action: 'SCAN',   detail: 'Gemini + Poe scanned' },
    { t: '13:36', agent: 'main',  action: 'POST',   detail: 'Daily summary → Discord' },
    { t: '13:00', agent: 'probe', action: 'SCAN',   detail: 'Data Leak Report' },
  ],
  stats: {
    postsTotal: 11,
    commentsTotal: 13,
    upvotesTotal: 38,
    errors: 0,
    uptime: '99.2%',
  },
}

/* ── Module-level cache ── */
let cached: Omit<AgentActivity, 'loading'> | null = null
let fetchPromise: Promise<Omit<AgentActivity, 'loading'>> | null = null

async function fetchActivity(): Promise<Omit<AgentActivity, 'loading'>> {
  if (cached) return cached

  if (!fetchPromise) {
    fetchPromise = (async () => {
      try {
        // Dynamic import to keep firebase out of initial bundle
        const { getDoc, doc } = await import('firebase/firestore')
        const { getDb } = await import('../lib/firebase')
        const snap = await getDoc(doc(getDb(), 'agent-activity', 'latest'))

        if (!snap.exists()) {
          cached = FALLBACK
          return FALLBACK
        }

        const data = snap.data()
        cached = {
          agents: data.agents || FALLBACK.agents,
          events: (data.events || []).slice(0, 8),
          stats: data.stats || FALLBACK.stats,
        }

        // Fill in any missing agents
        for (const id of ['main', 'mind', 'probe', 'adv']) {
          if (!cached.agents[id]) {
            cached.agents[id] = FALLBACK.agents[id]
          }
        }

        return cached
      } catch {
        cached = FALLBACK
        return FALLBACK
      }
    })()
  }

  return fetchPromise
}

/**
 * Fetches live agent activity from Firestore (agent-activity/latest).
 * Module-level cache — shared across components. Falls back to static data on error.
 */
export function useAgentActivity(): AgentActivity {
  const [data, setData] = useState<Omit<AgentActivity, 'loading'>>(cached || FALLBACK)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (cached) {
      setData(cached)
      setLoading(false)
      return
    }
    fetchActivity().then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  return { ...data, loading }
}
