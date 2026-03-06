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

/* ── Map standard schema → legacy interface ── */
function mapStandardToLegacy(data: Record<string, unknown>): Omit<AgentActivity, 'loading'> | null {
  const agents = data.agents as Record<string, Record<string, unknown>> | undefined
  const fleet = data.fleet as Record<string, unknown> | undefined
  const events = data.events as Record<string, unknown>[] | undefined
  if (!agents || !fleet) return null

  const mappedAgents: Record<string, AgentStats> = {}
  for (const [id, a] of Object.entries(agents)) {
    const stats = (a.stats || {}) as Record<string, number>
    mappedAgents[id] = {
      status: (a.status as string) || 'idle',
      posts: stats.actions || 0,
      upvotes: 0,
      comments: 0,
      lastAction: (a.currentTask as string) || '',
      lastActionAt: (a.updatedAt as string) || '',
    }
  }

  const mappedEvents: AgentEvent[] = (events || []).slice(0, 8).map(e => {
    const timeStr = (e.time as string) || ''
    const t = timeStr.includes('T') ? timeStr.slice(11, 16) : timeStr
    const typeMap: Record<string, string> = { post: 'POST', reply: 'ENGAGE', scan: 'SCAN', error: 'ERROR', learn: 'LEARN' }
    return {
      t,
      agent: (e.agentId as string) || '',
      action: typeMap[(e.type as string)] || 'POST',
      detail: (e.detail as string) || '',
    }
  })

  return {
    agents: mappedAgents,
    events: mappedEvents,
    stats: {
      postsTotal: (fleet.totalActions as number) || 0,
      commentsTotal: 0,
      upvotesTotal: 0,
      errors: (fleet.totalErrors as number) || 0,
      uptime: ((fleet.uptime as number) || 99) + '%',
    },
  }
}

async function fetchActivity(): Promise<Omit<AgentActivity, 'loading'>> {
  if (cached) return cached

  if (!fetchPromise) {
    fetchPromise = (async () => {
      try {
        const { getDoc, doc } = await import('firebase/firestore')
        const { getDb } = await import('../lib/firebase')
        const db = getDb()

        // Try standard path first (dashboards/ultralab/activity/latest)
        const stdSnap = await getDoc(doc(db, 'dashboards', 'ultralab', 'activity', 'latest'))
        if (stdSnap.exists()) {
          const mapped = mapStandardToLegacy(stdSnap.data())
          if (mapped) {
            // Fill missing agents
            for (const id of ['main', 'mind', 'probe', 'adv']) {
              if (!mapped.agents[id]) mapped.agents[id] = FALLBACK.agents[id]
            }
            cached = mapped
            return cached
          }
        }

        // Fallback: legacy path (agent-activity/latest)
        const legSnap = await getDoc(doc(db, 'agent-activity', 'latest'))
        if (legSnap.exists()) {
          const data = legSnap.data()
          cached = {
            agents: data.agents || FALLBACK.agents,
            events: (data.events || []).slice(0, 8),
            stats: data.stats || FALLBACK.stats,
          }
          for (const id of ['main', 'mind', 'probe', 'adv']) {
            if (!cached.agents[id]) cached.agents[id] = FALLBACK.agents[id]
          }
          return cached
        }

        cached = FALLBACK
        return FALLBACK
      } catch {
        cached = FALLBACK
        return FALLBACK
      }
    })()
  }

  return fetchPromise
}

/**
 * Fetches live agent activity from Firestore.
 * Reads from dashboards/ultralab/activity/latest (standard schema),
 * falls back to agent-activity/latest (legacy), then to static data.
 * Module-level cache — shared across components.
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
