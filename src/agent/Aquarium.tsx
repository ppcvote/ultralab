/* ── Ultra Aquarium ── Theme 3
   Deep-ocean aesthetic with bioluminescent agent tanks.
   Each agent is a marine creature in their own illuminated tank. */

import { useState, useEffect, useRef } from 'react'
import { AGENTS_META } from './agent-data'
import AquariumCreature from './AquariumCreatures'
import AgentPopup from './AgentPopup'
import './aquarium.css'

/* ── Constants ── */
const AGENT_IDS = ['main', 'mind', 'probe', 'adv'] as const
const AGENT_COLORS: Record<string, string> = {
  main: '#8A5CFF', mind: '#14B8A6', probe: '#EF4444', adv: '#F59E0B',
}
const CREATURE_NAMES: Record<string, string> = {
  main: 'Octopus', mind: 'Fish School', probe: 'Anglerfish', adv: 'Sea Turtle',
}
const TANK_NAMES: Record<string, string> = {
  main: 'COMMAND REEF', mind: 'SOCIAL LAGOON', probe: 'DEEP TRENCH', adv: 'WISDOM COVE',
}
const STATUS_LABELS: Record<string, string> = {
  main: 'ACTIVE', mind: 'CRUISING', probe: 'HUNTING', adv: 'PATROLLING',
}

const FEEDING_LOG: { time: string; agentId: string; detail: string }[] = [
  { time: '14:57', agentId: 'main', detail: 'Published fleet briefing to Moltbook' },
  { time: '14:42', agentId: 'mind', detail: 'Scheduled 3 posts across accounts' },
  { time: '14:31', agentId: 'probe', detail: 'Completed LLM scan — 2 vulns found' },
  { time: '14:15', agentId: 'adv', detail: 'Generated retirement plan draft' },
  { time: '13:58', agentId: 'main', detail: 'Engaged 4 trending submolts' },
  { time: '13:40', agentId: 'mind', detail: 'AI-generated content for 5 threads' },
  { time: '13:22', agentId: 'probe', detail: 'Probing endpoint: chatbot.example.com' },
  { time: '13:05', agentId: 'adv', detail: 'Insurance portfolio analysis complete' },
  { time: '12:48', agentId: 'main', detail: 'Trend analysis — AI security hot topic' },
  { time: '12:30', agentId: 'mind', detail: 'Cross-posted to Bluesky + Discord' },
]

const TASKS: Record<string, string[]> = {
  main: ['Drafting fleet post...', 'Engaging community...', 'Publishing strategy...', 'Analyzing trends...'],
  mind: ['Scheduling content...', 'Generating threads...', 'Hashtag research...', 'Queue processing...'],
  probe: ['Scanning endpoints...', 'Injecting prompts...', 'Writing vuln report...', 'Analyzing defenses...'],
  adv: ['Reviewing portfolios...', 'Planning retirement...', 'Insurance analysis...', 'Client briefing...'],
}

const TANK_STATS: Record<string, { temp: string; ph: string; salinity: string }> = {
  main: { temp: '24.3°C', ph: '7.8', salinity: '35 ppt' },
  mind: { temp: '25.1°C', ph: '7.6', salinity: '34 ppt' },
  probe: { temp: '4.2°C', ph: '8.1', salinity: '38 ppt' },
  adv: { temp: '23.8°C', ph: '7.4', salinity: '33 ppt' },
}

const h2a = (h: string, a: number) => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ── Caustic Light Canvas ── */
function CausticCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let t = 0

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Caustic light spots
      for (let i = 0; i < 8; i++) {
        const x = (Math.sin(t * 0.3 + i * 1.2) * 0.5 + 0.5) * W
        const y = (Math.cos(t * 0.25 + i * 0.9) * 0.3 + 0.15) * H
        const radius = 20 + Math.sin(t * 0.5 + i) * 10
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
        grad.addColorStop(0, 'rgba(77, 163, 255, 0.06)')
        grad.addColorStop(1, 'rgba(77, 163, 255, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      t += 0.02
      raf = requestAnimationFrame(draw)
    }

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.8 }} />
}

/* ── Plankton Particles Canvas ── */
function PlanktonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number

    interface Particle { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }
    const particles: Particle[] = []
    const colors = ['#8A5CFF', '#14B8A6', '#4DA3FF', '#ffffff']

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    resize()

    // Initialize particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.1 - Math.random() * 0.3,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy

        // Wrap
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width }
        if (p.x < -5) p.x = canvas.width + 5
        if (p.x > canvas.width + 5) p.x = -5

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba').replace('##', '#')
        // Simple alpha approach
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.fill()
        ctx.globalAlpha = 1
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6 }} />
}

/* ── Water Surface SVG ── */
function WaterSurface({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 12" preserveAspectRatio="none"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 12, zIndex: 3, opacity: 0.5 }}>
      <path
        d="M0,8 C20,4 40,12 60,8 C80,4 100,12 120,8 L120,0 L0,0 Z"
        fill={h2a(color, 0.15)}
        style={{ animation: 'aq-wave-alt 4s ease-in-out infinite' }}
      />
      <path
        d="M0,6 C15,10 35,2 55,6 C75,10 95,2 120,6 L120,0 L0,0 Z"
        fill={h2a(color, 0.08)}
        style={{ animation: 'aq-wave-alt 5s ease-in-out infinite reverse' }}
      />
    </svg>
  )
}

/* ── Tank Component ── */
function Tank({ agentId, onClick }: { agentId: string; onClick: () => void }) {
  const color = AGENT_COLORS[agentId]
  const agent = AGENTS_META.find(a => a.id === agentId)
  const [task, setTask] = useState(0)

  // Task cycling
  useEffect(() => {
    const tasks = TASKS[agentId]
    if (!tasks) return
    const interval = setInterval(() => setTask(p => (p + 1) % tasks.length), 3000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [agentId])

  if (!agent) return null

  return (
    <div
      className="aq-tank"
      onClick={onClick}
      style={{
        minHeight: 220,
        background: `linear-gradient(180deg, ${h2a(color, 0.04)} 0%, ${h2a('#0A1628', 0.95)} 30%, ${h2a('#060D1A', 0.98)} 100%)`,
        border: `1px solid ${h2a(color, 0.2)}`,
        boxShadow: `inset 0 0 30px ${h2a(color, 0.05)}, 0 0 15px ${h2a(color, 0.08)}`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `inset 0 0 40px ${h2a(color, 0.1)}, 0 0 30px ${h2a(color, 0.2)}, 0 4px 20px rgba(0,0,0,0.3)`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `inset 0 0 30px ${h2a(color, 0.05)}, 0 0 15px ${h2a(color, 0.08)}`
      }}
    >
      {/* Water surface */}
      <WaterSurface color={color} />

      {/* Tank glass edge (top highlight) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${h2a(color, 0.3)}, transparent)`,
        zIndex: 4,
      }} />

      {/* Tank label */}
      <div style={{
        position: 'absolute', top: 10, left: 12, zIndex: 5,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
          color: h2a(color, 0.7), letterSpacing: '0.1em',
        }}>
          {TANK_NAMES[agentId]}
        </span>
      </div>

      {/* Status badge */}
      <div style={{
        position: 'absolute', top: 10, right: 12, zIndex: 5,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: 'aq-status-pulse 2s ease-in-out infinite',
          color: color,
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: h2a(color, 0.7),
        }}>
          {STATUS_LABELS[agentId]}
        </span>
      </div>

      {/* Creature viewport */}
      <div style={{ position: 'absolute', top: 20, left: 0, right: 0, bottom: 52, zIndex: 2 }}>
        <AquariumCreature agentId={agentId} color={color} />
      </div>

      {/* Inner bioluminescent glow */}
      <div style={{
        position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
        width: 60, height: 60, borderRadius: '50%',
        background: `radial-gradient(circle, ${h2a(color, 0.08)} 0%, transparent 70%)`,
        animation: 'aq-biolum 4s ease-in-out infinite',
        zIndex: 1,
      }} />

      {/* Agent info bar (bottom) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '8px 12px',
        background: `linear-gradient(transparent, ${h2a('#060D1A', 0.95)})`,
        zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{agent.emoji}</span>
            <span style={{ fontWeight: 700, fontSize: 11, color: 'white' }}>{agent.shortName}</span>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
            padding: '1px 5px', borderRadius: 3,
            background: h2a(color, 0.15), color: h2a(color, 0.7),
            border: `1px solid ${h2a(color, 0.2)}`,
          }}>
            {CREATURE_NAMES[agentId]}
          </span>
        </div>
        {/* Current task */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          color: h2a(color, 0.6),
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ color: h2a(color, 0.4) }}>&gt;</span>
          {TASKS[agentId]?.[task]}
          <span style={{
            display: 'inline-block', width: 4, height: 10,
            background: h2a(color, 0.5), marginLeft: 2,
            animation: 'aq-angler-light 1s step-end infinite',
          }} />
        </div>
      </div>

      {/* Corner brackets (glass frame) */}
      <div style={{ position: 'absolute', top: 3, left: 3, width: 10, height: 10, borderTop: `1px solid ${h2a(color, 0.3)}`, borderLeft: `1px solid ${h2a(color, 0.3)}`, borderRadius: '4px 0 0 0', zIndex: 6 }} />
      <div style={{ position: 'absolute', top: 3, right: 3, width: 10, height: 10, borderTop: `1px solid ${h2a(color, 0.3)}`, borderRight: `1px solid ${h2a(color, 0.3)}`, borderRadius: '0 4px 0 0', zIndex: 6 }} />
      <div style={{ position: 'absolute', bottom: 3, left: 3, width: 10, height: 10, borderBottom: `1px solid ${h2a(color, 0.3)}`, borderLeft: `1px solid ${h2a(color, 0.3)}`, borderRadius: '0 0 0 4px', zIndex: 6 }} />
      <div style={{ position: 'absolute', bottom: 3, right: 3, width: 10, height: 10, borderBottom: `1px solid ${h2a(color, 0.3)}`, borderRight: `1px solid ${h2a(color, 0.3)}`, borderRadius: '0 0 4px 0', zIndex: 6 }} />
    </div>
  )
}

/* ── Feeding Log (live activity feed) ── */
function FeedingLog() {
  const [visibleCount, setVisibleCount] = useState(3)

  useEffect(() => {
    if (visibleCount >= FEEDING_LOG.length) return
    const t = setTimeout(() => setVisibleCount(c => Math.min(c + 1, FEEDING_LOG.length)), 2000)
    return () => clearTimeout(t)
  }, [visibleCount])

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 10,
      background: 'rgba(6, 13, 26, 0.9)',
      border: '1px solid rgba(77, 163, 255, 0.12)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      maxHeight: 180,
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: 'rgba(77, 163, 255, 0.5)',
        letterSpacing: '0.1em', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%', background: '#4DA3FF',
          animation: 'aq-status-pulse 2s infinite', color: '#4DA3FF',
        }} />
        FEEDING LOG
      </div>
      {FEEDING_LOG.slice(0, visibleCount).map((entry, i) => (
        <div key={i} className="aq-feed-line" style={{
          display: 'flex', gap: 8, marginBottom: 5, animationDelay: `${i * 0.1}s`,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{entry.time}</span>
          <span style={{ color: AGENT_COLORS[entry.agentId], flexShrink: 0 }}>
            {AGENTS_META.find(a => a.id === entry.agentId)?.shortName}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>{entry.detail}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Tank Monitoring Panel ── */
function TankMonitor() {
  const [selectedTank, setSelectedTank] = useState('main')
  const stats = TANK_STATS[selectedTank]
  const color = AGENT_COLORS[selectedTank]

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 10,
      background: 'rgba(6, 13, 26, 0.9)',
      border: '1px solid rgba(77, 163, 255, 0.12)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: 'rgba(77, 163, 255, 0.5)',
        letterSpacing: '0.1em', marginBottom: 10,
      }}>
        TANK MONITOR
      </div>

      {/* Tank selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {AGENT_IDS.map(id => (
          <button key={id} onClick={() => setSelectedTank(id)} style={{
            padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
            background: selectedTank === id ? h2a(AGENT_COLORS[id], 0.2) : 'rgba(255,255,255,0.03)',
            color: selectedTank === id ? AGENT_COLORS[id] : 'rgba(255,255,255,0.3)',
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.2s',
          }}>
            {AGENTS_META.find(a => a.id === id)?.emoji}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'WATER TEMP', value: stats.temp, icon: '🌡️' },
          { label: 'pH LEVEL', value: stats.ph, icon: '🧪' },
          { label: 'SALINITY', value: stats.salinity, icon: '🧂' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11 }}>{s.icon}</span> {s.label}
            </span>
            <span style={{ color: h2a(color, 0.8), fontWeight: 600 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Environment bar */}
      <div style={{ marginTop: 12 }}>
        <div style={{
          fontSize: 8, color: 'rgba(255,255,255,0.2)', marginBottom: 4,
        }}>
          ECOSYSTEM HEALTH
        </div>
        <div style={{
          height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: '92%', borderRadius: 2,
            background: `linear-gradient(90deg, ${h2a(color, 0.4)}, ${h2a(color, 0.7)})`,
            transition: 'all 0.5s',
          }} />
        </div>
        <div style={{
          fontSize: 8, color: h2a(color, 0.5), marginTop: 2, textAlign: 'right',
        }}>
          92% OPTIMAL
        </div>
      </div>

      {/* Fleet summary */}
      <div style={{
        marginTop: 10, paddingTop: 10,
        borderTop: '1px solid rgba(77, 163, 255, 0.08)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
      }}>
        {[
          { label: 'SPECIES', value: '4' },
          { label: 'ACTIONS/DAY', value: '28+' },
          { label: 'UPTIME', value: '99.2%' },
          { label: 'ERRORS', value: '0' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Pipe Connection (SVG between tanks) ── */
function AquariumPipes() {
  return (
    <svg style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
    }} viewBox="0 0 100 100" preserveAspectRatio="none">
      {/* Horizontal pipe between top tanks */}
      <line x1="48" y1="22" x2="52" y2="22" stroke="rgba(77, 163, 255, 0.1)" strokeWidth="0.3"
        strokeDasharray="1 1" style={{ animation: 'aq-current 2s linear infinite' }} />
      {/* Horizontal pipe between bottom tanks */}
      <line x1="24" y1="72" x2="28" y2="72" stroke="rgba(77, 163, 255, 0.1)" strokeWidth="0.3"
        strokeDasharray="1 1" style={{ animation: 'aq-current 2s linear infinite' }} />
      <line x1="48" y1="72" x2="52" y2="72" stroke="rgba(77, 163, 255, 0.1)" strokeWidth="0.3"
        strokeDasharray="1 1" style={{ animation: 'aq-current 2s linear infinite', animationDelay: '0.5s' }} />
      <line x1="72" y1="72" x2="76" y2="72" stroke="rgba(77, 163, 255, 0.1)" strokeWidth="0.3"
        strokeDasharray="1 1" style={{ animation: 'aq-current 2s linear infinite', animationDelay: '1s' }} />
      {/* Vertical connections */}
      <line x1="25" y1="45" x2="25" y2="50" stroke="rgba(77, 163, 255, 0.08)" strokeWidth="0.3"
        strokeDasharray="1 1" />
      <line x1="75" y1="45" x2="75" y2="50" stroke="rgba(77, 163, 255, 0.08)" strokeWidth="0.3"
        strokeDasharray="1 1" />
    </svg>
  )
}

/* ── Main Component ── */
export default function Aquarium() {
  const [popupAgent, setPopupAgent] = useState<string | null>(null)

  return (
    <section style={{ padding: '0 1.5rem 2rem', position: 'relative' }}>
      <div style={{
        maxWidth: '64rem',
        margin: '0 auto',
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #060D1A 0%, #0A1628 40%, #081020 100%)',
        border: '1px solid rgba(77, 163, 255, 0.1)',
        boxShadow: '0 0 40px rgba(77, 163, 255, 0.05), inset 0 0 60px rgba(0, 0, 0, 0.3)',
        padding: '20px',
      }}>
        {/* Background effects */}
        <CausticCanvas />
        <PlanktonCanvas />

        {/* Title bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, position: 'relative', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🐠</span>
            <h2 style={{
              fontSize: 14, fontWeight: 800, letterSpacing: '0.15em', margin: 0,
              fontFamily: "'JetBrains Mono', monospace",
              background: 'linear-gradient(90deg, #4DA3FF, #14B8A6, #8A5CFF)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'aq-title-shimmer 6s linear infinite',
            }}>
              ULTRA AQUARIUM
            </h2>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            color: 'rgba(77, 163, 255, 0.5)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: '#10B981',
              boxShadow: '0 0 6px #10B981',
            }} />
            4 TANKS ONLINE
          </div>
        </div>

        {/* Tank Grid (2×2) */}
        <div className="aq-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 16,
          position: 'relative',
          zIndex: 5,
        }}>
          {AGENT_IDS.map(id => (
            <Tank key={id} agentId={id} onClick={() => setPopupAgent(id)} />
          ))}
        </div>

        {/* Bottom: Feeding Log + Tank Monitor */}
        <div className="aq-bottom-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          position: 'relative',
          zIndex: 5,
        }}>
          <FeedingLog />
          <TankMonitor />
        </div>

        {/* Water pipe connections (behind everything) */}
        <AquariumPipes />
      </div>

      {/* Agent Popup */}
      {popupAgent && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100,
        }}>
          <AgentPopup agentId={popupAgent} onClose={() => setPopupAgent(null)} />
        </div>
      )}
    </section>
  )
}
