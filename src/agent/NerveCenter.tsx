import { useState, useEffect } from 'react'
import './nerve-center.css'

type AgentStatus = 'online' | 'idle' | 'scanning' | 'pending'

interface AgentConfig {
  id: string
  name: string
  handle: string
  room: string
  color: string
  status: AgentStatus
  tasks: string[]
  postsToday: number
  commentsToday: number
  nextScheduled: string
  // Pixel character
  headExtra: string       // CSS class for accessory
  bodyStyle: string       // CSS class for body variant
  skinColor: string
  hairColor: string
  shirtColor: string
  pantsColor: string
  monitorColor: string
  deskColor: string
}

const AGENTS: AgentConfig[] = [
  {
    id: 'main', name: 'UltraLabTW', handle: '@ultralabtw', room: 'COMMAND CENTER', color: '#8A5CFF',
    status: 'online',
    tasks: ['Drafting strategy post...', 'Analyzing Moltbook trends...', 'Publishing article...', 'Reviewing fleet data...', 'Sending TG report...'],
    postsToday: 4, commentsToday: 8, nextScheduled: '20:00',
    headExtra: 'nc-accessory-headset', bodyStyle: '', skinColor: '#C4956A',
    hairColor: '#2D1B4E', shirtColor: '#6B3FA0', pantsColor: '#2A1F3D',
    monitorColor: 'rgba(138,92,255,0.35)', deskColor: 'rgba(138,92,255,0.15)',
  },
  {
    id: 'mindthread', name: 'MindThreadBot', handle: '@mindthreadbot', room: 'SOCIAL HUB', color: '#14B8A6',
    status: 'idle',
    tasks: ['Queue ready — 3 posts staged', 'Awaiting schedule window...', 'Standby mode...'],
    postsToday: 3, commentsToday: 5, nextScheduled: '21:00',
    headExtra: 'nc-accessory-hoodie', bodyStyle: '', skinColor: '#B8D4E3',
    hairColor: '#0E7490', shirtColor: '#115E59', pantsColor: '#1A3A3A',
    monitorColor: 'rgba(20,184,166,0.35)', deskColor: 'rgba(20,184,166,0.15)',
  },
  {
    id: 'probe', name: 'UltraProbeBot', handle: '@ultraprobebot', room: 'SECURITY LAB', color: '#EF4444',
    status: 'scanning',
    tasks: ['Probing AI endpoints...', 'Injecting test prompts...', 'Scanning LLM responses...', 'Flagging vulnerabilities...', 'Writing security report...'],
    postsToday: 2, commentsToday: 3, nextScheduled: '19:00',
    headExtra: 'nc-accessory-goggles', bodyStyle: '', skinColor: '#8B9DAF',
    hairColor: '#1E293B', shirtColor: '#7F1D1D', pantsColor: '#1C1917',
    monitorColor: 'rgba(239,68,68,0.35)', deskColor: 'rgba(239,68,68,0.15)',
  },
  {
    id: 'advisor', name: 'UltraAdvisor', handle: '@ultraadvisor', room: 'ADVISORY SUITE', color: '#F59E0B',
    status: 'pending',
    tasks: ['Awaiting deployment...'],
    postsToday: 0, commentsToday: 0, nextScheduled: '—',
    headExtra: '', bodyStyle: 'nc-accessory-suit', skinColor: '#D4A574',
    hairColor: '#78350F', shirtColor: '#92400E', pantsColor: '#451A03',
    monitorColor: 'rgba(245,158,11,0.2)', deskColor: 'rgba(245,158,11,0.1)',
  },
]

const EVENTS = [
  { time: '14:57', agentId: 'mindthread', color: '#14B8A6', action: 'POSTED', detail: 'Multi-Account Strategy' },
  { time: '14:06', agentId: 'main', color: '#8A5CFF', action: 'ENGAGED', detail: 'r/tech → +12 upvotes' },
  { time: '13:58', agentId: 'probe', color: '#EF4444', action: 'ALERT', detail: '3 vulns detected' },
  { time: '13:36', agentId: 'main', color: '#8A5CFF', action: 'REPORT', detail: 'Daily summary → TG' },
  { time: '13:00', agentId: 'probe', color: '#EF4444', action: 'POSTED', detail: 'Data Leak Report' },
  { time: '12:30', agentId: 'mindthread', color: '#14B8A6', action: 'QUEUED', detail: '3 posts for next run' },
]

const STATUS_META: Record<AgentStatus, { label: string; color: string; pulse: boolean }> = {
  online:   { label: 'ONLINE',   color: '#10B981', pulse: true  },
  idle:     { label: 'IDLE',     color: '#F59E0B', pulse: false },
  scanning: { label: 'SCANNING', color: '#4DA3FF', pulse: true  },
  pending:  { label: 'OFFLINE',  color: 'rgba(255,255,255,0.15)', pulse: false },
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* ── Pixel Character Component ── */
function PixelCharacter({ agent }: { agent: AgentConfig }) {
  const isPending = agent.status === 'pending'
  const isActive = agent.status === 'online' || agent.status === 'scanning'
  const isScanning = agent.status === 'scanning'
  const isIdle = agent.status === 'idle'

  const charAnimation = isActive
    ? 'nc-agent-bounce 1.8s ease-in-out infinite'
    : isScanning
    ? 'nc-agent-scan 2.5s ease-in-out infinite'
    : isIdle
    ? 'nc-agent-idle 3s ease-in-out infinite'
    : 'nc-ghost-pulse 3s ease-in-out infinite'

  const opacity = isPending ? 0.3 : 1

  return (
    <div className="nc-pixel-char" style={{ opacity }}>
      {/* Character body group */}
      <div style={{ animation: charAnimation, transformOrigin: 'bottom center' }}>
        {/* Hair/top */}
        <div style={{
          width: 22, height: 5, margin: '0 auto',
          background: agent.hairColor, borderRadius: '4px 4px 0 0',
          opacity: isPending ? 0.4 : 1,
        }} />

        {/* Head */}
        <div
          className={`nc-px-head ${agent.headExtra}`}
          style={{ background: isPending ? 'rgba(255,255,255,0.08)' : agent.skinColor }}
        />

        {/* Body / torso */}
        <div
          className={`nc-px-body ${agent.bodyStyle}`}
          style={{ background: isPending ? 'rgba(255,255,255,0.06)' : agent.shirtColor }}
        >
          {/* Typing hands (only when active) */}
          {isActive && (
            <div className="nc-px-hands nc-typing" style={{}}>
              <span style={{ background: agent.skinColor }} />
              <span style={{ background: agent.skinColor }} />
            </div>
          )}
        </div>

        {/* Chair */}
        <div className="nc-px-chair" />

        {/* Legs */}
        <div className="nc-px-legs">
          <span style={{ background: isPending ? 'rgba(255,255,255,0.05)' : agent.pantsColor }} />
          <span style={{ background: isPending ? 'rgba(255,255,255,0.05)' : agent.pantsColor }} />
        </div>
      </div>

      {/* Desk (static, doesn't bounce) */}
      <div className="nc-px-desk" style={{ background: agent.deskColor, border: `1px solid ${hexToRgba(agent.color, 0.2)}` }}>
        <div className="nc-px-monitor" style={{
          background: isPending ? 'rgba(255,255,255,0.03)' : agent.monitorColor,
        }}>
          {!isPending && (
            <div style={{
              position: 'absolute', inset: 2, borderRadius: 1,
              background: isActive
                ? `linear-gradient(135deg, ${hexToRgba(agent.color, 0.6)}, ${hexToRgba(agent.color, 0.2)})`
                : hexToRgba(agent.color, 0.15),
              animation: isActive ? 'nc-screen-flicker 3s ease-in-out infinite' : 'none',
            }} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Individual Agent Workstation ── */
function Workstation({ agent }: { agent: AgentConfig }) {
  const [taskIdx, setTaskIdx] = useState(0)
  const [progress, setProgress] = useState(Math.random() * 50 + 20)
  const isPending = agent.status === 'pending'
  const isIdle = agent.status === 'idle'
  const isActive = agent.status === 'online' || agent.status === 'scanning'
  const sm = STATUS_META[agent.status]

  useEffect(() => {
    if (!isActive) return
    const t = setInterval(() => setTaskIdx(i => (i + 1) % agent.tasks.length), 3800)
    return () => clearInterval(t)
  }, [isActive, agent.tasks.length])

  useEffect(() => {
    if (isPending) return
    const speed = isActive ? 300 : 700
    const step = isActive ? 1.5 : 0.3
    const t = setInterval(() => setProgress(p => p >= 98 ? (isIdle ? 35 : 4) : p + step), speed)
    return () => clearInterval(t)
  }, [isActive, isIdle, isPending])

  return (
    <div
      className="nc-workstation"
      onMouseEnter={e => { if (!isPending) (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 24px ${hexToRgba(agent.color, 0.2)}` }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
      style={{
        background: isPending ? 'rgba(8, 4, 18, 0.5)' : 'rgba(12, 6, 24, 0.92)',
        border: `1px solid ${isPending ? 'rgba(255,255,255,0.06)' : hexToRgba(agent.color, 0.25)}`,
        borderRadius: 8,
        overflow: 'hidden',
        opacity: isPending ? 0.45 : 1,
        backdropFilter: 'blur(10px)',
        transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
        position: 'relative',
      }}
    >
      {/* Room label strip */}
      <div style={{
        padding: '5px 10px',
        background: isPending ? 'rgba(255,255,255,0.02)' : hexToRgba(agent.color, 0.1),
        borderBottom: `1px solid ${hexToRgba(agent.color, 0.12)}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 7.5, letterSpacing: 2.5, color: hexToRgba(agent.color, isPending ? 0.3 : 0.8), fontWeight: 700 }}>
          {agent.room}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', background: sm.color, flexShrink: 0,
            animation: sm.pulse ? 'nc-pulse 2s ease-in-out infinite' : 'none',
            '--dot-color': sm.color,
          } as React.CSSProperties} />
          <span style={{ fontSize: 7, color: sm.color, letterSpacing: 1.5 }}>{sm.label}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 10px 10px' }}>
        {/* Pixel Character */}
        <PixelCharacter agent={agent} />

        {/* Name + handle */}
        <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: agent.color, lineHeight: 1.2 }}>{agent.name}</div>
          <div style={{ fontSize: 8, color: 'rgba(226,232,240,0.3)', letterSpacing: 0.5 }}>{agent.handle}</div>
        </div>

        {!isPending ? (
          <>
            {/* Current task */}
            <div style={{
              textAlign: 'center', fontSize: 9, color: 'rgba(226,232,240,0.4)',
              minHeight: 14, marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4,
            }}>
              {agent.tasks[taskIdx]}
              {isActive && <span className="nc-blink-cursor">_</span>}
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${Math.round(progress)}%`,
                background: isActive
                  ? `linear-gradient(90deg, ${agent.color}, ${hexToRgba(agent.color, 0.6)})`
                  : hexToRgba(agent.color, 0.3),
                boxShadow: isActive ? `0 0 8px ${hexToRgba(agent.color, 0.6)}` : 'none',
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Mini stats */}
            <div style={{
              display: 'flex', justifyContent: 'space-around',
              fontSize: 8.5, color: 'rgba(226,232,240,0.3)',
              borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 6,
            }}>
              <span>📝 {agent.postsToday}</span>
              <span>💬 {agent.commentsToday}</span>
              <span>⏰ {agent.nextScheduled}</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 8.5, color: 'rgba(245,158,11,0.45)', letterSpacing: 2, paddingTop: 4, paddingBottom: 6, animation: 'nc-blink 2.5s ease-in-out infinite' }}>
            ◌ DEPLOYING SOON
          </div>
        )}
      </div>

      {/* Scanning sweep line */}
      {agent.status === 'scanning' && <div className="nc-scan-line" />}
    </div>
  )
}

/* ── NerveCenter: Pixel Art Virtual Office ── */
export default function NerveCenter() {
  return (
    <section className="nerve-center" style={{ paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Section label */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{
            display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: 4,
            background: 'rgba(138, 92, 255, 0.1)', border: '1px solid rgba(138, 92, 255, 0.2)',
            color: '#8A5CFF', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
            marginBottom: '1rem',
          }}>
            virtual-office --view pixel
          </span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.4rem' }}>
            虛擬辦公室 — <span style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>像素鳥瞰圖</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>4 隻 AI 員工正在他們的崗位上工作</p>
        </div>

        {/* Colony container */}
        <div className="nc-colony-box">

          {/* Header bar */}
          <div className="nc-header">
            <span className="nc-title">▓▓ ULTRA LAB — VIRTUAL OFFICE ▓▓</span>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <span style={{ color: '#10B981' }}>● 3 ACTIVE</span>
              <span style={{ color: 'rgba(226,232,240,0.25)' }}>○ 1 PENDING</span>
            </div>
          </div>

          {/* Main: floor plan + right panel */}
          <div className="nc-main-layout">

            {/* Floor plan */}
            <div className="nc-floor-tiles">
              <div style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(138,92,255,0.25)', marginBottom: 12, textAlign: 'center' }}>
                ── WORKSTATIONS ──
              </div>
              <div className="nc-agent-grid">
                {AGENTS.map(a => <Workstation key={a.id} agent={a} />)}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="nc-sidebar">

              {/* Event log */}
              <div style={{ flex: 1, padding: '12px 14px', borderBottom: '1px solid rgba(138, 92, 255, 0.08)', minHeight: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: 8, letterSpacing: 2.5, color: 'rgba(226,232,240,0.25)', marginBottom: 10 }}>
                  ── EVENT LOG ──
                </div>
                {EVENTS.map((ev, i) => (
                  <div key={i} style={{ marginBottom: 9, animation: `nc-feed-in 0.4s ease ${i * 0.07}s both` }}>
                    <div style={{ fontSize: 8.5, color: 'rgba(226,232,240,0.25)', marginBottom: 1 }}>{ev.time}</div>
                    <span style={{ fontSize: 8.5, fontWeight: 700, color: ev.color, marginRight: 4 }}>[{ev.action}]</span>
                    <span style={{ fontSize: 9.5, color: 'rgba(226,232,240,0.55)' }}>{ev.detail}</span>
                  </div>
                ))}
                <span style={{ display: 'inline-block', width: 6, height: 12, background: '#8A5CFF', animation: 'nc-cursor 1s step-end infinite', verticalAlign: 'middle', marginTop: 2 }} />
              </div>

              {/* Fleet stats */}
              <div style={{ padding: '12px 14px', flexShrink: 0 }}>
                <div style={{ fontSize: 8, letterSpacing: 2.5, color: 'rgba(226,232,240,0.25)', marginBottom: 10 }}>
                  ── FLEET STATS ──
                </div>
                {[
                  { label: 'Posts / day', value: '9' },
                  { label: 'Comments',    value: '16' },
                  { label: 'Errors 24h',  value: '0',      color: '#10B981' },
                  { label: 'Uptime',      value: '99.2%',  color: '#10B981' },
                  { label: 'Ops cost',    value: '$0 / mo', color: '#10B981' },
                ].map(s => (
                  <div key={s.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 10.5,
                  }}>
                    <span style={{ color: 'rgba(226,232,240,0.3)' }}>{s.label}</span>
                    <span style={{ fontWeight: 700, color: s.color ?? 'rgba(226,232,240,0.75)' }}>{s.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: 'rgba(226,232,240,0.25)', marginBottom: 3 }}>
                    <span>API Usage (RPD)</span>
                    <span>85 / 1,500</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '5.7%', background: 'linear-gradient(90deg, #10B981, #F59E0B)', borderRadius: 2 }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
