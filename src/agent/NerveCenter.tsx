import { useState, useEffect, useCallback } from 'react'
import { ROOMS, AGENTS_META, AGENTS_VISUAL, type RoomDef } from './agent-data'
import { buildRoute, INIT_STEPS, type Pos } from './pathfinding'
import { AgentPixelSprite } from './sprites'
import RoomFurniture from './Furniture'
import AgentPopup from './AgentPopup'
import ParticleCanvas from './ParticleCanvas'
import { useAgentActivity } from '../hooks/useAgentActivity'
import './nerve-center.css'

/* ── Helpers ── */
const h2a = (h: string, a: number) => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ── Agent color map for event log ── */
const AGENT_COLORS: Record<string, string> = {
  main: '#8A5CFF', mind: '#14B8A6', probe: '#EF4444', adv: '#F59E0B',
}

/* ── Precompute routes ── */
const ROUTES = Object.fromEntries(
  AGENTS_VISUAL.map(a => [a.id, buildRoute(a.id)])
)

/* ── Room component (with hover + furniture) ── */
function Room({ r, hovered, isActive, onHover }: { r: RoomDef; hovered: boolean; isActive: boolean; onHover: (id: string | null) => void }) {
  return (
    <div
      className="nc-room"
      onMouseEnter={() => onHover(r.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: 'absolute',
        top: `${r.top}%`, left: `${r.left}%`,
        width: `${r.w}%`, height: `${r.h}%`,
        border: `3px solid ${h2a(r.color, hovered ? 0.65 : 0.4)}`,
        borderRadius: 6,
        background: h2a(r.color, hovered ? 0.16 : 0.12),
        boxShadow: hovered ? `0 0 20px ${h2a(r.color, 0.08)}` : 'none',
        transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
        overflow: 'visible',
      }}
    >
      {/* Room inner tile grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(${h2a(r.color, 0.03)} 1px, transparent 1px),
          linear-gradient(90deg, ${h2a(r.color, 0.03)} 1px, transparent 1px)
        `,
        backgroundSize: '16px 16px',
        borderRadius: 4,
        pointerEvents: 'none',
      }} />
      {/* Room label */}
      <span style={{
        position: 'absolute', top: 6, left: 8,
        fontSize: 10, letterSpacing: 2,
        color: h2a(r.color, 0.7), fontWeight: 700,
      }}>
        {r.label}
      </span>
      {/* Door frame — corridor-facing wall */}
      {r.top < 50 ? (
        /* Top rooms: door at bottom */
        <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 4, height: 10, background: h2a(r.color, 0.3), borderRadius: 1 }} />
          <div style={{ width: 28, height: 10, background: '#060210' }} />
          <div style={{ width: 4, height: 10, background: h2a(r.color, 0.3), borderRadius: 1 }} />
        </div>
      ) : (
        /* Bottom rooms: door at top */
        <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 4, height: 10, background: h2a(r.color, 0.3), borderRadius: 1 }} />
          <div style={{ width: 28, height: 10, background: '#060210' }} />
          <div style={{ width: 4, height: 10, background: h2a(r.color, 0.3), borderRadius: 1 }} />
        </div>
      )}
      {/* Furniture */}
      <RoomFurniture roomId={r.id} color={r.color} />
      {/* Active glow when owner agent is working */}
      {isActive && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 6, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 60%, ${h2a(r.color, 0.07)}, transparent 70%)`,
          boxShadow: `inset 0 0 28px ${h2a(r.color, 0.08)}, 0 0 14px ${h2a(r.color, 0.05)}`,
          animation: 'nc-room-pulse 3s ease-in-out infinite',
        }} />
      )}
    </div>
  )
}

/* ── Agent Sprite ── */
function AgentSprite({ agentId, pos, task, prevPos, walkFrame, agentState, onClick }: {
  agentId: string; pos: Pos; task: string; prevPos: Pos | null; walkFrame: number
  agentState: 'working' | 'walking' | 'idle'; onClick: () => void
}) {
  const meta = AGENTS_META.find(a => a.id === agentId)
  const visual = AGENTS_VISUAL.find(a => a.id === agentId)
  if (!meta || !visual) return null

  const isMoving = prevPos && (prevPos.x !== pos.x || prevPos.y !== pos.y)
  const facingLeft = prevPos && prevPos.x > pos.x
  const isWorking = agentState === 'working' && !isMoving

  // Animation: working = subtle typing bob, idle = gentle breathing, walking = wobble
  const bodyAnimation = isMoving
    ? 'none'
    : isWorking
      ? 'nc-typing 1.2s ease-in-out infinite'
      : 'rim-bob 2.5s ease-in-out infinite'

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${pos.x}%`, top: `${pos.y}%`,
        transform: `translate(-50%, -100%) ${facingLeft ? 'scaleX(-1)' : ''}`,
        transition: `left ${1.2 / visual.speed}s cubic-bezier(0.45,0,0.55,1), top ${1.2 / visual.speed}s cubic-bezier(0.45,0,0.55,1)`,
        zIndex: 20,
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
    >
      {/* Task bubble — smooth fade during walking */}
      <div className="nc-task-bubble" style={{
        borderColor: h2a(meta.color, 0.35),
        transform: facingLeft ? 'scaleX(-1)' : 'none',
        opacity: isMoving ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}>
        {isWorking && <span className="nc-typing-dot" style={{ color: meta.color }}>● </span>}
        {task}
      </div>
      {/* Character */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
           className={isMoving ? 'nc-wobble' : ''}>
        <div style={{ animation: bodyAnimation }}>
          <AgentPixelSprite agentId={agentId} scale={3.5} frame={isMoving ? walkFrame : 0} />
        </div>
        {/* Character shadow */}
        <div style={{
          width: isMoving ? 24 : 28, height: 8,
          borderRadius: '50%',
          background: `rgba(0,0,0,${isMoving ? 0.15 : 0.25})`,
          filter: 'blur(2px)',
          marginTop: -2,
          transition: 'width 0.3s, opacity 0.3s',
        }} />
        {/* Name label */}
        <div style={{
          fontSize: 9, color: meta.color, fontWeight: 700,
          whiteSpace: 'nowrap', marginTop: 2,
          transform: facingLeft ? 'scaleX(-1)' : 'none',
        }}>
          {meta.shortName}
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ── */
export default function NerveCenter() {
  // All 4 agents are active in the virtual office (even comingSoon ones walk around)
  const activeAgents = AGENTS_VISUAL
  const activity = useAgentActivity()

  const [steps, setSteps] = useState<Record<string, number>>(() =>
    Object.fromEntries(activeAgents.map(a => [a.id, INIT_STEPS[a.id] ?? 0]))
  )
  const [prevPositions, setPrevPositions] = useState<Record<string, Pos>>({})
  const [agentStates, setAgentStates] = useState<Record<string, 'working' | 'walking' | 'idle'>>(
    () => Object.fromEntries(activeAgents.map(a => [a.id, 'working']))
  )
  const [tasks, setTasks] = useState<Record<string, number>>({})
  const [walkFrame, setWalkFrame] = useState(0)
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    activeAgents.forEach((agent, ai) => {
      const route = ROUTES[agent.id]
      if (!route || route.length === 0) return

      let idx = INIT_STEPS[agent.id] ?? 0

      const advance = () => {
        const oldIdx = idx
        idx = (idx + 1) % route.length
        // Save prev position for facing direction
        setPrevPositions(p => ({ ...p, [agent.id]: route[oldIdx].pos }))
        setSteps(p => ({ ...p, [agent.id]: idx }))
        setAgentStates(p => ({ ...p, [agent.id]: route[idx].state }))
        const t = setTimeout(advance, route[idx].ms)
        timers.push(t)
      }
      timers.push(setTimeout(advance, route[idx]?.ms ?? 2000 + ai * 400))

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

    // Walk frame cycling (alternate standing/stride every 250ms)
    const walkInterval = setInterval(() => {
      setWalkFrame(f => (f + 1) % 2)
    }, 250)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(walkInterval)
    }
  }, [])

  const closePopup = useCallback(() => setSelectedAgent(null), [])

  return (
    <section className="nerve-center" style={{ paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="nc-tag">colony.view --mode=rimworld</span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.4rem' }}>
            虛擬辦公室 — <span style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Colony View</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>4 隻 AI 員工的工作基地 — 即時走動中</p>
        </div>

        <div className="rim-colony">
          <div className="nc-header">
            <span className="nc-title">▓▓ ULTRA LAB HQ ▓▓</span>
            <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
              <span style={{ color: '#10B981' }}>● {activeAgents.length} ACTIVE</span>
            </div>
          </div>

          <div className="rim-layout">
            {/* Floor plan */}
            <div className="rim-floorplan">
              {/* Corridor floor texture */}
              <div style={{
                position: 'absolute',
                top: '42%', left: 0, right: 0, height: '16%',
                backgroundImage: 'linear-gradient(rgba(138,92,255,0.03) 1px, transparent 1px)',
                backgroundSize: '100% 8px',
                pointerEvents: 'none',
                zIndex: 0,
              }} />
              {/* Corridor label */}
              <div className="nc-corridor-label">── CORRIDOR ──</div>
              {/* Corridor decorations */}
              <div className="nc-corridor-deco nc-watercooler" />
              <div className="nc-corridor-deco nc-plant" />
              {/* Ambient particles */}
              <ParticleCanvas />
              {/* Rooms */}
              {ROOMS.map(r => (
                <Room key={r.id} r={r} hovered={hoveredRoom === r.id} isActive={!!r.owner && agentStates[r.owner] === 'working'} onHover={setHoveredRoom} />
              ))}
              {/* Moving agents */}
              {activeAgents.map(a => {
                const route = ROUTES[a.id]
                const stepIdx = steps[a.id] ?? 0
                const pos = route?.[stepIdx]?.pos ?? { x: 50, y: 50 }
                return (
                  <AgentSprite
                    key={a.id}
                    agentId={a.id}
                    pos={pos}
                    prevPos={prevPositions[a.id] ?? null}
                    task={activity.agents[a.id]?.lastAction || a.tasks[tasks[a.id] ?? 0]}
                    walkFrame={walkFrame}
                    agentState={agentStates[a.id] ?? 'working'}
                    onClick={() => setSelectedAgent(a.id)}
                  />
                )
              })}
              {/* Agent popup */}
              {selectedAgent && (
                <AgentPopup agentId={selectedAgent} onClose={closePopup} />
              )}
            </div>

            {/* Sidebar */}
            <div className="nc-sidebar">
              <div style={{ flex: 1, padding: '12px 16px', borderBottom: '1px solid rgba(138,92,255,0.1)', overflow: 'hidden' }}>
                <div className="nc-section-label">── EVENT LOG ──{activity.loading ? '' : ' (LIVE)'}</div>
                {activity.events.slice(0, 6).map((e, i) => {
                  const color = AGENT_COLORS[e.agent] || '#8A5CFF'
                  return (
                    <div key={`${e.t}-${e.agent}-${i}`} style={{ marginBottom: 8, animation: `nc-feed-in 0.3s ease ${i * 0.06}s both`, paddingLeft: 8, borderLeft: `2px solid ${color}` }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 1 }}>{e.t}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color }}>[{e.action}] </span>
                      <span className="nc-typewrite-detail" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', animation: `nc-type-reveal 0.8s steps(25) ${(0.45 + i * 0.08).toFixed(2)}s forwards` }}>{e.detail}</span>
                    </div>
                  )
                })}
                <span className="nc-blink-cursor" />
              </div>
              <div style={{ padding: '12px 16px', flexShrink: 0 }}>
                <div className="nc-section-label">── FLEET ──</div>
                {[
                  { l: 'Posts',    v: String(activity.stats.postsTotal) },
                  { l: 'Comments', v: String(activity.stats.commentsTotal) },
                  { l: 'Upvotes',  v: String(activity.stats.upvotesTotal), c: '#a78bfa' },
                  { l: 'Errors',   v: String(activity.stats.errors),       c: '#10B981' },
                  { l: 'Uptime',   v: activity.stats.uptime,               c: '#10B981' },
                  { l: 'Cost',     v: '$0/mo',                             c: '#10B981' },
                ].map(s => (
                  <div key={s.l} className="nc-stat-row">
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>{s.l}</span>
                    <span style={{ fontWeight: 800, color: s.c ?? 'rgba(255,255,255,0.8)' }}>{s.v}</span>
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
