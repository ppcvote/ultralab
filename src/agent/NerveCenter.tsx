import { useState, useEffect } from 'react'
import './nerve-center.css'

/* ── Types ── */
type Pos = { x: number; y: number }
type Step = { pos: Pos; ms: number }

/* ── Floor plan rooms (% of floor container) ── */
const ROOMS = [
  { id: 'cmd',  label: 'COMMAND',     color: '#8A5CFF', top: 4,  left: 2,  w: 35, h: 39, icon: '🖥' },
  { id: 'srv',  label: 'SERVER ROOM', color: '#4DA3FF', top: 4,  left: 63, w: 35, h: 39, icon: '⚙️' },
  { id: 'soc',  label: 'SOCIAL HUB', color: '#14B8A6', top: 57, left: 2,  w: 28, h: 39, icon: '📱' },
  { id: 'sec',  label: 'SEC-LAB',    color: '#EF4444', top: 57, left: 35, w: 28, h: 39, icon: '🔬' },
  { id: 'adv',  label: 'ADVISORY',   color: '#F59E0B', top: 57, left: 68, w: 28, h: 39, icon: '📊' },
]

/* ── Agents + movement routes ──
   x/y are % of the floor container (0-100)
   Agents walk through corridor (y ≈ 50) to reach other rooms */
interface AgentDef {
  id: string; name: string; shortName: string
  color: string; skin: string; body: string
  route: Step[]; tasks: string[]
  pending?: boolean
}

const AGENTS: AgentDef[] = [
  {
    id: 'main', name: 'UltraLabTW', shortName: 'UltraLab',
    color: '#8A5CFF', skin: '#C4956A', body: '#6B3FA0',
    tasks: ['Drafting post...', 'Trend analysis...', 'Publishing...', 'Fleet briefing...'],
    route: [
      { pos: { x: 15, y: 20 }, ms: 2200 }, // desk
      { pos: { x: 24, y: 28 }, ms: 900 },  // pace in command
      { pos: { x: 15, y: 20 }, ms: 1500 }, // back to desk
      { pos: { x: 15, y: 50 }, ms: 600 },  // enter corridor
      { pos: { x: 70, y: 50 }, ms: 900 },  // walk corridor →
      { pos: { x: 70, y: 20 }, ms: 2500 }, // server room
      { pos: { x: 70, y: 50 }, ms: 600 },  // leave server
      { pos: { x: 48, y: 50 }, ms: 500 },  // corridor center
      { pos: { x: 15, y: 50 }, ms: 600 },  // back to left
    ],
  },
  {
    id: 'mind', name: 'MindThreadBot', shortName: 'MindThr',
    color: '#14B8A6', skin: '#B8D4E3', body: '#115E59',
    tasks: ['Queue staged...', 'Scheduling posts...', 'Content gen...'],
    route: [
      { pos: { x: 11, y: 73 }, ms: 2200 }, // desk
      { pos: { x: 19, y: 80 }, ms: 900 },  // pace
      { pos: { x: 11, y: 73 }, ms: 1500 }, // back
      { pos: { x: 16, y: 50 }, ms: 600 },  // corridor
      { pos: { x: 48, y: 50 }, ms: 700 },  // walk right
      { pos: { x: 70, y: 50 }, ms: 600 },  // continue
      { pos: { x: 70, y: 20 }, ms: 2200 }, // server room
      { pos: { x: 70, y: 50 }, ms: 600 },  // leave
      { pos: { x: 16, y: 50 }, ms: 800 },  // walk back
    ],
  },
  {
    id: 'probe', name: 'UltraProbeBot', shortName: 'Probe',
    color: '#EF4444', skin: '#8B9DAF', body: '#7F1D1D',
    tasks: ['Probing endpoints...', 'Injecting prompts...', 'Scanning LLM...', 'Writing report...'],
    route: [
      { pos: { x: 44, y: 73 }, ms: 2000 }, // desk
      { pos: { x: 52, y: 80 }, ms: 900 },  // pace
      { pos: { x: 44, y: 73 }, ms: 1500 }, // back
      { pos: { x: 45, y: 50 }, ms: 600 },  // corridor
      { pos: { x: 70, y: 50 }, ms: 700 },  // walk right
      { pos: { x: 70, y: 20 }, ms: 3000 }, // server room (long scan)
      { pos: { x: 70, y: 50 }, ms: 600 },  // leave
      { pos: { x: 45, y: 50 }, ms: 600 },  // back
    ],
  },
  {
    id: 'adv', name: 'UltraAdvisor', shortName: 'Advisor',
    color: '#F59E0B', skin: '#D4A574', body: '#92400E',
    tasks: ['Retirement analysis...', 'Insurance review...', 'Portfolio planning...', 'Client brief...'],
    route: [
      { pos: { x: 79, y: 73 }, ms: 2200 }, // desk
      { pos: { x: 85, y: 80 }, ms: 900 },  // pace
      { pos: { x: 79, y: 73 }, ms: 1500 }, // back
      { pos: { x: 79, y: 50 }, ms: 600 },  // corridor
      { pos: { x: 70, y: 50 }, ms: 600 },  // walk left
      { pos: { x: 70, y: 20 }, ms: 2000 }, // server room
      { pos: { x: 70, y: 50 }, ms: 600 },  // leave
      { pos: { x: 79, y: 50 }, ms: 600 },  // walk back
    ],
  },
]

/* ── Starting step per agent so floor plan is immediately alive ──
   main=0: at desk | mind=4: mid-corridor → server | probe=5: in server | adv=2: desk → corridor soon */
const INIT_STEPS: Record<string, number> = { main: 0, mind: 4, probe: 5, adv: 2 }

const FEED = [
  { t: '15:12', c: '#F59E0B', a: 'POST',   d: 'Retirement Planning 101' },
  { t: '14:57', c: '#14B8A6', a: 'POST',   d: 'Multi-Account Strategy' },
  { t: '14:06', c: '#8A5CFF', a: 'ENGAGE', d: 'r/tech +12↑' },
  { t: '13:58', c: '#EF4444', a: 'ALERT',  d: '3 vulns detected' },
  { t: '13:36', c: '#8A5CFF', a: 'REPORT', d: 'Daily summary → TG' },
  { t: '13:00', c: '#EF4444', a: 'POST',   d: 'Data Leak Report' },
]

const h2a = (h: string, a: number) => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ── Room (static background) ── */
function Room({ r }: { r: typeof ROOMS[0] }) {
  const dim = (r as any).pending
  return (
    <div style={{
      position: 'absolute',
      top: `${r.top}%`, left: `${r.left}%`,
      width: `${r.w}%`, height: `${r.h}%`,
      border: `2px solid ${dim ? 'rgba(255,255,255,0.06)' : h2a(r.color, 0.28)}`,
      borderRadius: 3,
      background: dim ? 'rgba(10,5,21,0.3)' : h2a(r.color, 0.05),
      opacity: dim ? 0.45 : 1,
      overflow: 'visible',
    }}>
      {/* Room label */}
      <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 7, letterSpacing: 2, color: h2a(r.color, 0.65), fontWeight: 700 }}>
        {r.label}
      </span>
      {/* Furniture icon */}
      <span style={{ position: 'absolute', right: 6, bottom: 8, fontSize: 16, opacity: 0.25 }}>{r.icon}</span>
      {/* Door gap — bottom center */}
      <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 16, height: 4, background: '#070312', zIndex: 2 }} />
    </div>
  )
}

/* ── Agent sprite (moves via CSS transition) ── */
function AgentSprite({ a, pos, task }: { a: AgentDef; pos: Pos; task: string }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${pos.x}%`, top: `${pos.y}%`,
      transform: 'translate(-50%, -100%)',
      transition: 'left 1.2s cubic-bezier(0.45,0,0.55,1), top 1.2s cubic-bezier(0.45,0,0.55,1)',
      zIndex: 20,
      opacity: a.pending ? 0.2 : 1,
      pointerEvents: 'none',
    }}>
      {/* Task bubble */}
      {!a.pending && (
        <div style={{
          background: 'rgba(6,3,14,0.92)', border: `1px solid ${h2a(a.color, 0.35)}`,
          borderRadius: 3, padding: '1px 5px', fontSize: 7, color: 'rgba(255,255,255,0.5)',
          whiteSpace: 'nowrap', marginBottom: 3, maxWidth: 90,
          overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center',
        }}>
          {task}
        </div>
      )}
      {/* Pixel character */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <div className="rim-head" style={{
          background: a.skin, border: `1px solid ${h2a(a.color, 0.8)}`,
          animation: a.pending ? 'none' : 'rim-bob 2s ease-in-out infinite',
        }}>
          <span className="rim-eye rim-eye-l" />
          <span className="rim-eye rim-eye-r" />
        </div>
        <div className="rim-body" style={{ background: a.body }} />
        <div style={{ fontSize: 7, color: a.color, fontWeight: 700, whiteSpace: 'nowrap', marginTop: 2 }}>
          {a.shortName}
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ── */
export default function NerveCenter() {
  const [steps, setSteps] = useState<Record<string, number>>(() =>
    Object.fromEntries(AGENTS.filter(a => !a.pending).map(a => [a.id, INIT_STEPS[a.id] ?? 0]))
  )
  const [tasks, setTasks] = useState<Record<string, number>>({})

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    AGENTS.forEach((agent, ai) => {
      if (agent.pending) return
      let idx = INIT_STEPS[agent.id] ?? 0
      const advance = () => {
        idx = (idx + 1) % agent.route.length
        setSteps(p => ({ ...p, [agent.id]: idx }))
        const t = setTimeout(advance, agent.route[idx].ms)
        timers.push(t)
      }
      timers.push(setTimeout(advance, agent.route[idx].ms + ai * 400))

      // Task cycling
      if (agent.tasks.length > 1) {
        let ti = 0
        const cycle = () => {
          ti = (ti + 1) % agent.tasks.length
          setTasks(p => ({ ...p, [agent.id]: ti }))
          timers.push(setTimeout(cycle, 3200 + Math.random() * 1800))
        }
        timers.push(setTimeout(cycle, 2500 + ai * 900))
      }
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className="nerve-center" style={{ paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: 4, background: 'rgba(138,92,255,0.1)', border: '1px solid rgba(138,92,255,0.2)', color: '#8A5CFF', fontSize: '0.75rem', marginBottom: '1rem' }}>
            colony.view --mode=rimworld
          </span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.4rem' }}>
            虛擬辦公室 — <span style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Colony View</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>4 隻 AI 員工的工作基地 — 即時走動中</p>
        </div>

        <div className="rim-colony">
          <div className="nc-header">
            <span className="nc-title">▓▓ ULTRA LAB HQ ▓▓</span>
            <div style={{ display: 'flex', gap: 14, fontSize: 10 }}>
              <span style={{ color: '#10B981' }}>● 4 ACTIVE</span>
            </div>
          </div>

          <div className="rim-layout">
            {/* ── Floor plan ── */}
            <div className="rim-floorplan">
              {/* Corridor label */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 7, letterSpacing: 4, color: 'rgba(138,92,255,0.18)', zIndex: 1 }}>
                ── CORRIDOR ──
              </div>
              {/* Rooms */}
              {ROOMS.map(r => <Room key={r.id} r={r} />)}
              {/* Moving agents */}
              {AGENTS.map(a => (
                <AgentSprite
                  key={a.id}
                  a={a}
                  pos={a.route[steps[a.id] ?? 0]?.pos ?? a.route[0].pos}
                  task={a.tasks[tasks[a.id] ?? 0]}
                />
              ))}
            </div>

            {/* ── Sidebar ── */}
            <div className="nc-sidebar">
              <div style={{ flex: 1, padding: '10px 12px', borderBottom: '1px solid rgba(138,92,255,0.08)', overflow: 'hidden' }}>
                <div style={{ fontSize: 7.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.18)', marginBottom: 8 }}>── EVENT LOG ──</div>
                {FEED.map((e, i) => (
                  <div key={i} style={{ marginBottom: 7, animation: `nc-feed-in 0.3s ease ${i * 0.06}s both` }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginBottom: 1 }}>{e.t}</div>
                    <span style={{ fontSize: 8, fontWeight: 700, color: e.c }}>[{e.a}] </span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{e.d}</span>
                  </div>
                ))}
                <span style={{ display: 'inline-block', width: 5, height: 10, background: '#8A5CFF', animation: 'nc-cursor 1s step-end infinite' }} />
              </div>
              <div style={{ padding: '10px 12px', flexShrink: 0 }}>
                <div style={{ fontSize: 7.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.18)', marginBottom: 8 }}>── FLEET ──</div>
                {[
                  { l: 'Posts/day', v: '9' },
                  { l: 'Comments',  v: '16' },
                  { l: 'Errors',    v: '0',      c: '#10B981' },
                  { l: 'Uptime',    v: '99.2%',  c: '#10B981' },
                  { l: 'Cost',      v: '$0/mo',  c: '#10B981' },
                ].map(s => (
                  <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 10 }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)' }}>{s.l}</span>
                    <span style={{ fontWeight: 700, color: (s as any).c ?? 'rgba(255,255,255,0.65)' }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
