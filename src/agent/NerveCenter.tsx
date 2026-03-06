import { useState, useEffect } from 'react'
import './nerve-center.css'

/* ── Types ── */
type AgentStatus = 'online' | 'idle' | 'scanning' | 'pending'

interface AgentConfig {
  id: string
  name: string
  room: string
  color: string
  floorColor: string
  status: AgentStatus
  tasks: string[]
  postsToday: number
  commentsToday: number
}

/* ── Data ── */
const AGENTS: AgentConfig[] = [
  {
    id: 'main', name: 'UltraLabTW', room: 'COMMAND', color: '#8A5CFF',
    floorColor: 'rgba(138,92,255,0.08)',
    status: 'online',
    tasks: ['Drafting post...', 'Reviewing trends...', 'Publishing...', 'Fleet report...'],
    postsToday: 4, commentsToday: 8,
  },
  {
    id: 'mind', name: 'MindThreadBot', room: 'SOCIAL', color: '#14B8A6',
    floorColor: 'rgba(20,184,166,0.08)',
    status: 'idle',
    tasks: ['Queue staged...', 'Standby...', 'Awaiting slot...'],
    postsToday: 3, commentsToday: 5,
  },
  {
    id: 'probe', name: 'UltraProbeBot', room: 'SEC-LAB', color: '#EF4444',
    floorColor: 'rgba(239,68,68,0.07)',
    status: 'scanning',
    tasks: ['Probing endpoints...', 'Injecting prompts...', 'Scanning LLM...', 'Writing report...'],
    postsToday: 2, commentsToday: 3,
  },
  {
    id: 'advisor', name: 'UltraAdvisor', room: 'ADVISORY', color: '#F59E0B',
    floorColor: 'rgba(245,158,11,0.05)',
    status: 'pending',
    tasks: ['Deploying...'],
    postsToday: 0, commentsToday: 0,
  },
]

const FEED = [
  { t: '14:57', c: '#14B8A6', a: 'POST', d: 'Multi-Account Strategy' },
  { t: '14:06', c: '#8A5CFF', a: 'ENGAGE', d: 'r/tech +12↑' },
  { t: '13:58', c: '#EF4444', a: 'ALERT', d: '3 vulns found' },
  { t: '13:36', c: '#8A5CFF', a: 'REPORT', d: 'Summary → TG' },
  { t: '13:00', c: '#EF4444', a: 'POST', d: 'Data Leak Report' },
]

const hex2a = (h: string, a: number) => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ── Pixel Character (tiny, sits in chair) ── */
function Colonist({ agent }: { agent: AgentConfig }) {
  const p = agent.status === 'pending'
  const active = agent.status === 'online' || agent.status === 'scanning'
  const scan = agent.status === 'scanning'
  const op = p ? 0.25 : 1

  return (
    <div className="rim-colonist" style={{ opacity: op }}>
      {/* head */}
      <div className="rim-head" style={{
        background: p ? '#333' : agent.id === 'main' ? '#C4956A' : agent.id === 'mind' ? '#B8D4E3' : agent.id === 'probe' ? '#8B9DAF' : '#D4A574',
        animation: scan ? 'rim-look 2s ease-in-out infinite' : active ? 'rim-bob 2s ease-in-out infinite' : 'none',
      }}>
        {/* eyes */}
        <span className="rim-eye rim-eye-l" />
        <span className="rim-eye rim-eye-r" />
        {/* accessory */}
        {agent.id === 'main' && !p && <span className="rim-headset" style={{ borderColor: hex2a(agent.color, 0.7) }} />}
        {agent.id === 'probe' && !p && <span className="rim-goggles" />}
      </div>
      {/* body */}
      <div className="rim-body" style={{
        background: p ? '#222' : agent.id === 'main' ? '#6B3FA0' : agent.id === 'mind' ? '#115E59' : agent.id === 'probe' ? '#7F1D1D' : '#92400E',
      }} />
      {/* arms/hands on desk */}
      {active && (
        <div className="rim-arms">
          <span className="rim-hand rim-hand-l" style={{ animation: 'rim-type-l 0.5s ease infinite' }} />
          <span className="rim-hand rim-hand-r" style={{ animation: 'rim-type-r 0.5s ease 0.12s infinite' }} />
        </div>
      )}
    </div>
  )
}

/* ── Furniture pieces (top-down blocks) ── */
function Desk({ color }: { color: string }) {
  return <div className="rim-desk" style={{ background: hex2a(color, 0.2), borderColor: hex2a(color, 0.35) }} />
}
function Monitor({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="rim-monitor" style={{ borderColor: hex2a(color, 0.5) }}>
      <div className="rim-screen" style={{
        background: active ? hex2a(color, 0.5) : hex2a(color, 0.15),
        animation: active ? 'rim-flicker 3s ease infinite' : 'none',
        boxShadow: active ? `0 0 6px ${hex2a(color, 0.4)}` : 'none',
      }} />
    </div>
  )
}
function Chair({ color }: { color: string }) {
  return <div className="rim-chair" style={{ background: hex2a(color, 0.15), borderColor: hex2a(color, 0.25) }} />
}

/* ── Single Room ── */
function Room({ agent }: { agent: AgentConfig }) {
  const [taskIdx, setTaskIdx] = useState(0)
  const active = agent.status === 'online' || agent.status === 'scanning'
  const p = agent.status === 'pending'

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setTaskIdx(i => (i + 1) % agent.tasks.length), 3200)
    return () => clearInterval(t)
  }, [active, agent.tasks.length])

  return (
    <div className="rim-room" style={{ opacity: p ? 0.5 : 1 }}>
      {/* Walls (the border IS the wall) */}
      {/* Floor */}
      <div className="rim-floor" style={{ background: agent.floorColor }}>
        {/* Room label (painted on wall) */}
        <div className="rim-room-label" style={{ color: hex2a(agent.color, 0.5) }}>
          {agent.room}
        </div>

        {/* Furniture layout: desk at top, monitor on desk, chair below, colonist in chair */}
        <div className="rim-furniture">
          <Monitor color={agent.color} active={active} />
          <Desk color={agent.color} />
          <div className="rim-seat-area">
            <Chair color={agent.color} />
            <Colonist agent={agent} />
          </div>
        </div>

        {/* Agent name */}
        <div className="rim-name" style={{ color: agent.color }}>
          {agent.name}
        </div>

        {/* Status + task line */}
        <div className="rim-status-line">
          <span className="rim-dot" style={{
            background: p ? '#555' : active ? '#10B981' : '#F59E0B',
            boxShadow: active ? '0 0 4px #10B981' : 'none',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8 }}>
            {p ? 'PENDING' : agent.tasks[taskIdx]}
            {active && <span className="nc-blink-cursor">_</span>}
          </span>
        </div>

        {/* Mini stats bar at bottom */}
        {!p && (
          <div className="rim-stats">
            <span>📝{agent.postsToday}</span>
            <span>💬{agent.commentsToday}</span>
          </div>
        )}
      </div>

      {/* Door opening (gap in bottom wall) */}
      <div className="rim-door" />

      {/* Scan sweep */}
      {agent.status === 'scanning' && <div className="rim-scanline" />}
    </div>
  )
}

/* ── Main Component ── */
export default function NerveCenter() {
  return (
    <section className="nerve-center" style={{ paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{
            display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: 4,
            background: 'rgba(138, 92, 255, 0.1)', border: '1px solid rgba(138, 92, 255, 0.2)',
            color: '#8A5CFF', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
            marginBottom: '1rem',
          }}>
            colony.view --mode=rimworld
          </span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.4rem' }}>
            虛擬辦公室 — <span style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Colony View</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>4 隻 AI 員工的工作基地</p>
        </div>

        {/* Colony container */}
        <div className="rim-colony">
          {/* Top bar */}
          <div className="nc-header">
            <span className="nc-title">▓▓ ULTRA LAB HQ ▓▓</span>
            <div style={{ display: 'flex', gap: 14, fontSize: 10 }}>
              <span style={{ color: '#10B981' }}>● 3 ACTIVE</span>
              <span style={{ color: '#666' }}>○ 1 PENDING</span>
            </div>
          </div>

          {/* Floor plan + sidebar */}
          <div className="rim-layout">

            {/* Floor plan */}
            <div className="rim-floorplan">
              {/* Corridor label */}
              <div className="rim-corridor-label">── CORRIDOR ──</div>

              {/* 2x2 rooms */}
              <div className="rim-rooms">
                {AGENTS.map(a => <Room key={a.id} agent={a} />)}
              </div>
            </div>

            {/* Side panel */}
            <div className="nc-sidebar">
              {/* Feed */}
              <div style={{ flex: 1, padding: '10px 12px', borderBottom: '1px solid rgba(138,92,255,0.08)', overflow: 'hidden' }}>
                <div style={{ fontSize: 7.5, letterSpacing: 2, color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>── LOG ──</div>
                {FEED.map((e, i) => (
                  <div key={i} style={{ marginBottom: 7, animation: `nc-feed-in 0.3s ease ${i * 0.06}s both` }}>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{e.t} </span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: e.c }}>[{e.a}] </span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{e.d}</span>
                  </div>
                ))}
                <span style={{ display: 'inline-block', width: 5, height: 10, background: '#8A5CFF', animation: 'nc-cursor 1s step-end infinite' }} />
              </div>
              {/* Stats */}
              <div style={{ padding: '10px 12px', flexShrink: 0 }}>
                <div style={{ fontSize: 7.5, letterSpacing: 2, color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>── FLEET ──</div>
                {[
                  { l: 'Posts/day', v: '9' },
                  { l: 'Comments', v: '16' },
                  { l: 'Errors', v: '0', c: '#10B981' },
                  { l: 'Uptime', v: '99.2%', c: '#10B981' },
                  { l: 'Cost', v: '$0/mo', c: '#10B981' },
                ].map(s => (
                  <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 10 }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)' }}>{s.l}</span>
                    <span style={{ fontWeight: 700, color: s.c ?? 'rgba(255,255,255,0.65)' }}>{s.v}</span>
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
