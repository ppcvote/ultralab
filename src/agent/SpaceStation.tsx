import { AGENTS_META } from './agent-data'
import { useAgentActivity } from '../hooks/useAgentActivity'
import './space-station.css'

/* ── Agent color map ── */
const AGENT_COLORS: Record<string, string> = {
  main: '#8A5CFF', mind: '#14B8A6', probe: '#EF4444', adv: '#F59E0B',
}

/* ── Module positions (% of schematic area) ── */
const MODULE_POS: Record<string, { top: string; left: string }> = {
  main:  { top: '10%', left: '8%' },
  mind:  { top: '10%', left: 'calc(100% - 178px - 8%)' },
  probe: { top: 'calc(100% - 130px - 10%)', left: '8%' },
  adv:   { top: 'calc(100% - 130px - 10%)', left: 'calc(100% - 178px - 8%)' },
}

/* ── Status display mapping ── */
const STATUS_LABEL: Record<string, string> = {
  active: 'ONLINE', online: 'ONLINE', busy: 'SCANNING',
  idle: 'STANDBY', offline: 'OFFLINE', pending: 'PENDING',
}
const STATUS_CLASS: Record<string, string> = {
  active: 'online', online: 'online', busy: 'scanning',
  idle: 'idle', offline: 'offline', pending: 'pending',
}

/* ── Helper ── */
function h2a(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/* ── Signal strength bars ── */
function SignalBars({ strength, color }: { strength: number; color: string }) {
  return (
    <div className="ss-signal">
      {[4, 7, 10, 12].map((h, i) => (
        <div
          key={i}
          className="ss-signal-bar"
          style={{
            height: h,
            background: i < strength ? color : 'rgba(255,255,255,0.08)',
            opacity: i < strength ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  )
}

/* ── Connection line (SVG) between module and center ── */
function ConnLine({ from, color }: { from: string; color: string }) {
  // Approximate center offsets per module position
  const lines: Record<string, { x1: string; y1: string; x2: string; y2: string }> = {
    main:  { x1: '22%', y1: '22%', x2: '48%', y2: '46%' },
    mind:  { x1: '78%', y1: '22%', x2: '52%', y2: '46%' },
    probe: { x1: '22%', y1: '78%', x2: '48%', y2: '54%' },
    adv:   { x1: '78%', y1: '78%', x2: '52%', y2: '54%' },
  }
  const l = lines[from]
  if (!l) return null
  return (
    <svg className="ss-conn-line" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <line
        x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
        stroke={color} strokeWidth="1" strokeDasharray="4 4"
        opacity="0.25"
      />
      {/* Data packet traveling along line */}
      <circle r="2" fill={color} opacity="0.6">
        <animateMotion
          dur={`${3 + Math.random() * 2}s`}
          repeatCount="indefinite"
          path={`M ${parsePercent(l.x1, 600)} ${parsePercent(l.y1, 520)} L ${parsePercent(l.x2, 600)} ${parsePercent(l.y2, 520)}`}
        />
      </circle>
    </svg>
  )
}

function parsePercent(pct: string, total: number) {
  return (parseFloat(pct) / 100) * total
}

/* ── Module Card ── */
function ModuleCard({ agentId, activity }: {
  agentId: string
  activity: ReturnType<typeof useAgentActivity>
}) {
  const meta = AGENTS_META.find(a => a.id === agentId)
  if (!meta) return null

  const color = meta.color
  const pos = MODULE_POS[agentId]
  const agentData = activity.agents[agentId]
  const status = agentData?.status || (meta.comingSoon ? 'pending' : 'online')
  const task = agentData?.lastAction || ''
  const isPending = meta.comingSoon

  // Signal strength based on status
  const signalStrength = status === 'active' || status === 'online' ? 4
    : status === 'idle' ? 3
    : status === 'busy' ? 4
    : 1

  return (
    <div
      className={`ss-module ${isPending ? 'ss-module-pending' : ''}`}
      style={{
        ...pos,
        borderColor: h2a(color, isPending ? 0.2 : 0.35),
        boxShadow: isPending ? 'none' : `0 0 16px ${h2a(color, 0.08)}, inset 0 0 20px ${h2a(color, 0.03)}`,
      }}
      onMouseEnter={(e) => {
        if (!isPending) {
          e.currentTarget.style.boxShadow = `0 0 24px ${h2a(color, 0.2)}, inset 0 0 30px ${h2a(color, 0.05)}`
          e.currentTarget.style.borderColor = h2a(color, 0.55)
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isPending ? 'none' : `0 0 16px ${h2a(color, 0.08)}, inset 0 0 20px ${h2a(color, 0.03)}`
        e.currentTarget.style.borderColor = h2a(color, isPending ? 0.2 : 0.35)
      }}
    >
      <div className="ss-module-label" style={{ color }}>
        MODULE-{agentId.toUpperCase()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div className="ss-module-name" style={{ color: 'rgba(255,255,255,0.9)' }}>
          {meta.shortName || meta.name}
        </div>
        <SignalBars strength={signalStrength} color={color} />
      </div>
      <div className="ss-module-role">{meta.role}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, marginBottom: 6 }}>
        <span className={`ss-status-dot ${STATUS_CLASS[status] || 'offline'}`} />
        <span style={{ color, fontWeight: 600 }}>{STATUS_LABEL[status] || status.toUpperCase()}</span>
      </div>
      {task && !isPending && (
        <div className="ss-module-task">{task}</div>
      )}
      {isPending && (
        <div className="ss-module-task" style={{ fontStyle: 'italic', opacity: 0.4 }}>
          AWAITING DEPLOYMENT
        </div>
      )}
      {/* Activity bar */}
      {!isPending && (
        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (agentData?.posts || 0) * 20 + 20)}%`,
            background: `linear-gradient(90deg, ${h2a(color, 0.6)}, ${color})`,
            borderRadius: 2,
            transition: 'width 1s ease',
          }} />
        </div>
      )}
    </div>
  )
}

/* ── Main Component ── */
export default function SpaceStation() {
  const activity = useAgentActivity()

  return (
    <section className="space-station" style={{ paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="ss-tag">station.status --view=orbital</span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.4rem', color: '#E2E8F0' }}>
            軌道指揮中心 — <span style={{ background: 'linear-gradient(135deg, #00D4FF, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Orbital Command</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>4 個 AI 模組的太空站運行狀態 — 全系統正常</p>
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
              {/* Orbital rings */}
              <div className="ss-orbit-ring" style={{ width: 320, height: 320 }} />
              <div className="ss-orbit-ring" style={{ width: 220, height: 220 }} />

              {/* Radar sweep */}
              <div className="ss-radar-sweep" />

              {/* Central core */}
              <div className="ss-core">
                <div className="ss-core-inner">
                  CORE<br />REACTOR
                </div>
              </div>

              {/* Connection lines */}
              {['main', 'mind', 'probe', 'adv'].map(id => (
                <ConnLine key={`conn-${id}`} from={id} color={AGENT_COLORS[id]} />
              ))}

              {/* Module cards */}
              {['main', 'mind', 'probe', 'adv'].map(id => (
                <ModuleCard key={id} agentId={id} activity={activity} />
              ))}
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
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{e.detail}</span>
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
