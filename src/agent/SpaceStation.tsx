import { useState, useEffect, useRef, useCallback } from 'react'
import { ExternalLink, Send, X } from 'lucide-react'
import { AGENTS_META } from './agent-data'
import { useAgentActivity } from '../hooks/useAgentActivity'
import './space-station.css'

/* ── Constants ── */
const AGENT_IDS = ['main', 'mind', 'probe', 'adv'] as const
const AGENT_COLORS: Record<string, string> = {
  main: '#8A5CFF', mind: '#14B8A6', probe: '#EF4444', adv: '#F59E0B',
}

/* Module positions: top-left offset % from schematic center */
const MODULE_POS: Record<string, { top: string; left: string }> = {
  main:  { top: '6%',  left: '5%' },
  mind:  { top: '6%',  left: 'calc(100% - 187px - 5%)' },
  probe: { top: 'calc(100% - 140px - 6%)', left: '5%' },
  adv:   { top: 'calc(100% - 140px - 6%)', left: 'calc(100% - 187px - 5%)' },
}

const STATUS_LABEL: Record<string, string> = {
  active: 'ONLINE', online: 'ONLINE', busy: 'SCANNING',
  idle: 'STANDBY', offline: 'OFFLINE', pending: 'PENDING',
}
const STATUS_CLASS: Record<string, string> = {
  active: 'online', online: 'online', busy: 'scanning',
  idle: 'idle', offline: 'offline', pending: 'pending',
}

/* ── Helpers ── */
function h2a(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/* ═══════════════════════════════════
   StarfieldCanvas — animated background
   ═══════════════════════════════════ */
interface Star {
  x: number; y: number; size: number; baseAlpha: number; alpha: number
  phase: number; twinkleSpeed: number
}

function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Stars
    const stars: Star[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * (w || 600),
      y: Math.random() * (h || 520),
      size: Math.random() * 1.4 + 0.3,
      baseAlpha: Math.random() * 0.6 + 0.15,
      alpha: 0,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
    }))

    // Shooting star state
    let shootX = 0, shootY = 0, shootVx = 0, shootVy = 0
    let shootAlpha = 0, shootTimer = 200 + Math.random() * 300

    let frame = 0
    let animId: number

    const animate = () => {
      ctx.clearRect(0, 0, w, h)
      frame++

      // Draw stars
      for (const s of stars) {
        s.alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(frame * s.twinkleSpeed + s.phase))
        ctx.save()
        ctx.globalAlpha = s.alpha
        ctx.fillStyle = '#E2E8F0'
        ctx.shadowBlur = s.size * 4
        ctx.shadowColor = `rgba(226, 232, 240, ${s.alpha * 0.5})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Shooting star
      shootTimer--
      if (shootTimer <= 0) {
        shootX = Math.random() * w * 0.6
        shootY = Math.random() * h * 0.3
        shootVx = 2.5 + Math.random() * 2
        shootVy = 1 + Math.random() * 1.5
        shootAlpha = 1
        shootTimer = 300 + Math.random() * 400
      }
      if (shootAlpha > 0) {
        shootX += shootVx
        shootY += shootVy
        shootAlpha -= 0.015

        ctx.save()
        ctx.globalAlpha = shootAlpha
        ctx.strokeStyle = '#00D4FF'
        ctx.lineWidth = 1.2
        ctx.shadowBlur = 8
        ctx.shadowColor = 'rgba(0, 212, 255, 0.5)'
        ctx.beginPath()
        ctx.moveTo(shootX, shootY)
        ctx.lineTo(shootX - shootVx * 12, shootY - shootVy * 12)
        ctx.stroke()
        ctx.restore()
      }

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 1,
    }} />
  )
}

/* ═══════════════════════════════════
   DataStreamCanvas — flowing particles along connection paths
   ═══════════════════════════════════ */
interface DataPacket {
  t: number; speed: number; color: string
  pathIndex: number; size: number; alpha: number
}

function DataStreamCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Paths: from each module corner to center (approximate percentages)
    const paths = [
      { from: { xp: 0.18, yp: 0.22 }, to: { xp: 0.50, yp: 0.50 }, color: '138,92,255' },   // main
      { from: { xp: 0.82, yp: 0.22 }, to: { xp: 0.50, yp: 0.50 }, color: '20,184,166' },    // mind
      { from: { xp: 0.18, yp: 0.78 }, to: { xp: 0.50, yp: 0.50 }, color: '239,68,68' },     // probe
      { from: { xp: 0.82, yp: 0.78 }, to: { xp: 0.50, yp: 0.50 }, color: '245,158,11' },    // adv
    ]

    // Create packets
    const packets: DataPacket[] = []
    for (let i = 0; i < paths.length; i++) {
      for (let j = 0; j < 3; j++) {
        packets.push({
          t: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
          color: paths[i].color,
          pathIndex: i,
          size: 1.5 + Math.random(),
          alpha: 0.4 + Math.random() * 0.4,
        })
      }
    }

    let animId: number

    const animate = () => {
      ctx.clearRect(0, 0, w, h)

      // Draw connection lines (faint)
      for (const p of paths) {
        ctx.save()
        ctx.strokeStyle = `rgba(${p.color}, 0.06)`
        ctx.lineWidth = 1
        ctx.setLineDash([4, 6])
        ctx.beginPath()
        ctx.moveTo(p.from.xp * w, p.from.yp * h)
        ctx.lineTo(p.to.xp * w, p.to.yp * h)
        ctx.stroke()
        ctx.restore()
      }

      // Draw & move packets
      for (const pk of packets) {
        const path = paths[pk.pathIndex]
        pk.t += pk.speed
        if (pk.t > 1) pk.t -= 1

        // Ping-pong: 0→1 = to core, 1→0 reversed
        const tt = pk.t < 0.5 ? pk.t * 2 : (1 - pk.t) * 2
        const x = path.from.xp + (path.to.xp - path.from.xp) * tt
        const y = path.from.yp + (path.to.yp - path.from.yp) * tt

        const pulseAlpha = pk.alpha * (0.5 + 0.5 * Math.sin(pk.t * Math.PI * 2))

        ctx.save()
        ctx.globalAlpha = pulseAlpha
        ctx.fillStyle = `rgba(${pk.color}, ${pulseAlpha})`
        ctx.shadowBlur = pk.size * 6
        ctx.shadowColor = `rgba(${pk.color}, ${pulseAlpha * 0.6})`
        ctx.beginPath()
        ctx.arc(x * w, y * h, pk.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 2,
    }} />
  )
}

/* ═══════════════════════════════════
   Signal Bars
   ═══════════════════════════════════ */
function SignalBars({ strength, color }: { strength: number; color: string }) {
  return (
    <div className="ss-signal">
      {[4, 7, 10, 12].map((h, i) => (
        <div key={i} className="ss-signal-bar" style={{
          height: h,
          background: i < strength ? color : 'rgba(255,255,255,0.06)',
          opacity: i < strength ? 1 : 0.2,
        }} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════
   Module Popup (click to inspect)
   ═══════════════════════════════════ */
function ModulePopup({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const agent = AGENTS_META.find(a => a.id === agentId)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('click', handler), 50)
    return () => { clearTimeout(t); document.removeEventListener('click', handler) }
  }, [onClose])

  if (!agent) return null

  return (
    <div ref={ref} className="ss-popup" style={{
      borderColor: h2a(agent.color, 0.4),
      borderTop: `3px solid ${h2a(agent.color, 0.6)}`,
    }}>
      <div className="ss-popup-scan" style={{ color: agent.color }} />
      <button onClick={onClose} className="ss-popup-close"><X size={14} /></button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 8,
          background: h2a(agent.color, 0.12),
          border: `1.5px solid ${h2a(agent.color, 0.3)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {agent.emoji}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: agent.color }}>{agent.role}</div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 10 }}>
        {agent.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {agent.topics.map(t => (
          <span key={t} style={{
            padding: '2px 6px', fontSize: 9, borderRadius: 3,
            background: h2a(agent.color, 0.12),
            border: `1px solid ${h2a(agent.color, 0.25)}`,
            color: agent.color,
          }}>
            {t}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {agent.moltbook && (
          <a href={agent.moltbook} target="_blank" rel="noopener noreferrer" className="ss-popup-link"
             style={{ borderColor: h2a('#8A5CFF', 0.3), color: '#a78bfa' }}>
            <ExternalLink size={12} /> Moltbook
          </a>
        )}
        {agent.telegram && (
          <a href={agent.telegram} target="_blank" rel="noopener noreferrer" className="ss-popup-link"
             style={{ borderColor: h2a('#4DA3FF', 0.3), color: '#4DA3FF' }}>
            <Send size={12} /> Telegram
          </a>
        )}
        {agent.product && (
          <a href={agent.product} target="_blank" rel="noopener noreferrer" className="ss-popup-link"
             style={{ borderColor: h2a(agent.color, 0.3), color: agent.color }}>
            <ExternalLink size={12} /> Product
          </a>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   Module Card
   ═══════════════════════════════════ */
function ModuleCard({ agentId, activity, onClick }: {
  agentId: string
  activity: ReturnType<typeof useAgentActivity>
  onClick: () => void
}) {
  const meta = AGENTS_META.find(a => a.id === agentId)
  if (!meta) return null

  const color = meta.color
  const pos = MODULE_POS[agentId]
  const agentData = activity.agents[agentId]
  const status = agentData?.status || (meta.comingSoon ? 'pending' : 'online')
  const task = agentData?.lastAction || ''
  const isPending = meta.comingSoon
  const signalStrength = status === 'active' || status === 'online' ? 4
    : status === 'idle' ? 3 : status === 'busy' ? 4 : 1

  return (
    <div
      className={`ss-module ${isPending ? 'ss-module-pending' : ''}`}
      onClick={onClick}
      style={{
        ...pos,
        borderColor: h2a(color, isPending ? 0.15 : 0.3),
        boxShadow: isPending ? 'none' : `0 0 20px ${h2a(color, 0.06)}, inset 0 0 24px ${h2a(color, 0.02)}`,
      }}
      onMouseEnter={(e) => {
        if (!isPending) {
          e.currentTarget.style.boxShadow = `0 0 30px ${h2a(color, 0.18)}, inset 0 0 30px ${h2a(color, 0.04)}`
          e.currentTarget.style.borderColor = h2a(color, 0.55)
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isPending ? 'none' : `0 0 20px ${h2a(color, 0.06)}, inset 0 0 24px ${h2a(color, 0.02)}`
        e.currentTarget.style.borderColor = h2a(color, isPending ? 0.15 : 0.3)
      }}
    >
      {/* Scan line effect */}
      {!isPending && <div className="ss-module-scan" style={{ color }} />}

      {/* Pulse ring for active modules */}
      {!isPending && status !== 'offline' && (
        <div className="ss-module-pulse-ring" style={{ borderColor: h2a(color, 0.15) }} />
      )}

      <div className="ss-module-label" style={{ color }}>MODULE-{agentId.toUpperCase()}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, position: 'relative', zIndex: 2 }}>
        <div className="ss-module-name" style={{ color: 'rgba(255,255,255,0.9)' }}>
          {meta.emoji} {meta.shortName || meta.name}
        </div>
        <SignalBars strength={signalStrength} color={color} />
      </div>
      <div className="ss-module-role">{meta.role}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, marginBottom: 6, position: 'relative', zIndex: 2 }}>
        <span className={`ss-status-dot ${STATUS_CLASS[status] || 'offline'}`} />
        <span style={{ color, fontWeight: 600 }}>{STATUS_LABEL[status] || status.toUpperCase()}</span>
      </div>

      {task && !isPending && (
        <div className="ss-module-task">{task}</div>
      )}
      {isPending && (
        <div className="ss-module-task" style={{ fontStyle: 'italic', opacity: 0.4 }}>
          AWAITING DEPLOYMENT...
        </div>
      )}

      {/* Activity bar with shimmer */}
      {!isPending && (
        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (agentData?.posts || 0) * 18 + 25)}%`,
            background: `linear-gradient(90deg, ${h2a(color, 0.4)}, ${color}, ${h2a(color, 0.4)})`,
            backgroundSize: '200% 100%',
            borderRadius: 2,
            animation: 'ss-bar-shimmer 3s ease-in-out infinite',
          }} />
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════
   Main Component
   ═══════════════════════════════════ */
export default function SpaceStation() {
  const activity = useAgentActivity()
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const closePopup = useCallback(() => setSelectedAgent(null), [])

  return (
    <section className="space-station" style={{ paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="ss-tag">station.status --view=orbital</span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.4rem', color: '#E2E8F0' }}>
            軌道指揮中心 — <span style={{ background: 'linear-gradient(135deg, #00D4FF, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Orbital Command</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>4 個 AI 模組的太空站運行狀態 — 即時監控中</p>
        </div>

        <div className="ss-frame">
          <div className="ss-header">
            <span className="ss-title">{"◇◇"} ORBITAL_COMMAND {"◇◇"}</span>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, alignItems: 'center' }}>
              <span style={{ color: '#10B981' }}>
                <span className="ss-status-dot online" style={{ marginRight: 4 }} />
                ALL SYSTEMS GO
              </span>
            </div>
          </div>

          <div className="ss-layout">
            {/* Station schematic */}
            <div className="ss-schematic">
              {/* Animated starfield */}
              <StarfieldCanvas />

              {/* Nebula ambient glows */}
              <div className="ss-nebula" style={{
                width: 200, height: 200, top: '20%', left: '15%',
                background: 'radial-gradient(ellipse, rgba(138, 92, 255, 0.08), transparent 70%)',
              }} />
              <div className="ss-nebula" style={{
                width: 180, height: 180, bottom: '15%', right: '20%',
                background: 'radial-gradient(ellipse, rgba(0, 212, 255, 0.06), transparent 70%)',
                animationDelay: '4s',
              }} />

              {/* Data stream particles */}
              <DataStreamCanvas />

              {/* Orbital rings */}
              <div className="ss-orbit-ring" style={{
                width: 340, height: 340,
                border: '1px dashed rgba(0, 212, 255, 0.07)',
              }} />
              <div className="ss-orbit-ring" style={{
                width: 240, height: 240,
                border: '1px solid rgba(0, 212, 255, 0.05)',
              }} />
              <div className="ss-orbit-ring" style={{
                width: 150, height: 150,
                border: '1px dashed rgba(0, 212, 255, 0.08)',
              }} />

              {/* Radar sweep */}
              <div className="ss-radar-sweep" />

              {/* Central core reactor */}
              <div className="ss-core">
                <div className="ss-core-ring ss-core-ring-1" />
                <div className="ss-core-ring ss-core-ring-2" />
                <div className="ss-core-ring ss-core-ring-3" />
                <div className="ss-core-center">CORE</div>
              </div>

              {/* Module cards */}
              {AGENT_IDS.map(id => (
                <ModuleCard
                  key={id}
                  agentId={id}
                  activity={activity}
                  onClick={() => setSelectedAgent(id)}
                />
              ))}

              {/* Popup */}
              {selectedAgent && (
                <ModulePopup agentId={selectedAgent} onClose={closePopup} />
              )}
            </div>

            {/* Sidebar */}
            <div className="ss-sidebar">
              <div style={{ flex: 1, padding: '12px 16px', borderBottom: '1px solid rgba(0,212,255,0.08)', overflow: 'hidden' }}>
                <div className="ss-section-label">{"──"} COMMS LOG {"──"}{activity.loading ? '' : ' (LIVE)'}</div>
                {activity.events.slice(0, 6).map((e, i) => {
                  const color = AGENT_COLORS[e.agent] || '#00D4FF'
                  return (
                    <div key={`${e.t}-${e.agent}-${i}`} style={{
                      marginBottom: 8,
                      animation: `nc-feed-in 0.3s ease ${i * 0.06}s both`,
                      paddingLeft: 8,
                      borderLeft: `2px solid ${color}`,
                    }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 1 }}>{e.t}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color }}>[{e.action}] </span>
                      <span className="ss-typewrite" style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        animationDelay: `${0.4 + i * 0.08}s`,
                      }}>
                        {e.detail}
                      </span>
                    </div>
                  )
                })}
                <span className="ss-blink-cursor" />
              </div>
              <div style={{ padding: '12px 16px', flexShrink: 0 }}>
                <div className="ss-section-label">{"──"} TELEMETRY {"──"}</div>
                {[
                  { l: 'Transmissions', v: String(activity.stats.postsTotal) },
                  { l: 'Relays',        v: String(activity.stats.commentsTotal) },
                  { l: 'Signals',       v: String(activity.stats.upvotesTotal), c: '#00D4FF' },
                  { l: 'Anomalies',     v: String(activity.stats.errors),       c: '#10B981' },
                  { l: 'Uptime',        v: activity.stats.uptime,               c: '#10B981' },
                  { l: 'Op Cost',       v: '$0/mo',                             c: '#10B981' },
                ].map(s => (
                  <div key={s.l} className="ss-stat-row">
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
