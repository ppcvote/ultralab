import './nerve-center.css'

const agents = [
  {
    id: 'main', name: 'UltraLabTW', emoji: '⚡', color: '#8A5CFF',
    status: 'online' as const, postsToday: 4, avgUpvotes: 12,
    commentsToday: 8, errors24h: 0, lastActivity: '14:06 Engage r/tech',
    nextScheduled: '15:00',
  },
  {
    id: 'mindthread', name: 'MindThreadBot', emoji: '🧵', color: '#14B8A6',
    status: 'idle' as const, postsToday: 3, avgUpvotes: 8,
    commentsToday: 5, errors24h: 0, lastActivity: '14:57 Posted r/general',
    nextScheduled: '21:00',
  },
  {
    id: 'probe', name: 'UltraProbeBot', emoji: '🔍', color: '#EF4444',
    status: 'scanning' as const, postsToday: 2, avgUpvotes: 6,
    commentsToday: 3, errors24h: 0, lastActivity: '13:58 Scanned target',
    nextScheduled: '19:00',
  },
  {
    id: 'advisor', name: 'UltraAdvisor', emoji: '💰', color: '#F59E0B',
    status: 'pending' as const, postsToday: 0, avgUpvotes: 0,
    commentsToday: 0, errors24h: 0, lastActivity: 'Awaiting deployment',
    nextScheduled: '—',
  },
]

const feed = [
  { time: '14:57', agent: 'mindthread', color: '#14B8A6', text: 'Posted to r/general — Multi-Account Strategy' },
  { time: '14:06', agent: 'main', color: '#8A5CFF', text: 'Engage r/tech — commented on AI thread' },
  { time: '13:58', agent: 'probe', color: '#EF4444', text: 'Scanned AI chatbot — 3 vulns found' },
  { time: '13:36', agent: 'main', color: '#8A5CFF', text: 'TG notification sent to Boss' },
  { time: '13:00', agent: 'probe', color: '#EF4444', text: 'Posted r/tech — Data Leak Risk Report' },
]

const STATUS_DOTS: Record<string, { bg: string; animate: boolean }> = {
  online: { bg: '#10B981', animate: true },
  idle: { bg: '#F59E0B', animate: false },
  scanning: { bg: '#4DA3FF', animate: true },
  error: { bg: '#EF4444', animate: true },
  pending: { bg: 'rgba(255,255,255,0.2)', animate: false },
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function NodeCard({ agent, idx }: { agent: typeof agents[0]; idx: number }) {
  const isPending = agent.status === 'pending'
  const dot = STATUS_DOTS[agent.status]
  const barWidth = Math.min((agent.postsToday / 10) * 100, 100)

  return (
    <div
      className="group"
      style={{
        background: 'rgba(10, 5, 21, 0.85)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${hexToRgba(agent.color, 0.2)}`,
        borderStyle: isPending ? 'dashed' : 'solid',
        borderRadius: 12,
        padding: '14px 16px',
        position: 'relative',
        overflow: 'hidden',
        opacity: isPending ? 0.5 : 1,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={e => { if (!isPending) (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${hexToRgba(agent.color, 0.3)}`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: agent.color, opacity: 0.6 }} />

      {/* Pending overlay */}
      {isPending && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(245,158,11,0.03) 8px, rgba(245,158,11,0.03) 16px)',
          zIndex: 2,
        }}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: '#F59E0B', animation: 'nc-blink 2s ease-in-out infinite' }}>
            AWAITING DEPLOYMENT
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(226,232,240,0.4)', letterSpacing: 2 }}>NODE-0{idx + 1}</span>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', background: dot.bg,
          animation: dot.animate ? 'nc-pulse 2s ease-in-out infinite' : 'none',
          '--dot-color': dot.bg,
        } as React.CSSProperties} />
      </div>

      {/* Name */}
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
        <span style={{ fontSize: 18, marginRight: 6 }}>{agent.emoji}</span>
        <span style={{ color: agent.color }}>{agent.name.replace('Bot', '').replace('Ultra', '')}</span>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(226,232,240,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {agent.status.toUpperCase()}
      </div>

      {/* Activity bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: agent.color, borderRadius: 2, boxShadow: `0 0 8px ${agent.color}` }} />
      </div>

      {/* Stats (hidden for pending) */}
      {!isPending && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: 11, marginBottom: 8 }}>
          <span style={{ color: 'rgba(226,232,240,0.4)' }}>Posts</span>
          <span style={{ textAlign: 'right', fontWeight: 500 }}>{agent.postsToday}</span>
          <span style={{ color: 'rgba(226,232,240,0.4)' }}>↑ Avg</span>
          <span style={{ textAlign: 'right', fontWeight: 500 }}>{agent.avgUpvotes}</span>
          <span style={{ color: 'rgba(226,232,240,0.4)' }}>Comments</span>
          <span style={{ textAlign: 'right', fontWeight: 500 }}>{agent.commentsToday}</span>
          <span style={{ color: 'rgba(226,232,240,0.4)' }}>Errors</span>
          <span style={{ textAlign: 'right', fontWeight: 500, color: agent.errors24h > 0 ? '#EF4444' : '#10B981' }}>{agent.errors24h}</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: 10, color: 'rgba(226,232,240,0.4)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{agent.lastActivity}</span>
        <span style={{ color: agent.color }}>{agent.nextScheduled}</span>
      </div>
    </div>
  )
}

export default function NerveCenter() {
  return (
    <section className="nerve-center" style={{ paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '70rem', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Container with border glow */}
        <div style={{
          borderRadius: 16,
          border: '1px solid rgba(138, 92, 255, 0.15)',
          background: 'rgba(10, 5, 21, 0.6)',
          padding: '20px 24px',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid rgba(138, 92, 255, 0.1)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
              <span style={{ color: 'rgba(226,232,240,0.4)' }}>▓▓ </span>
              <span style={{ color: '#8A5CFF', animation: 'nc-glitch 5s infinite', display: 'inline-block' }}>NERVE_CENTER</span>
              <span style={{ color: 'rgba(226,232,240,0.4)' }}> ▓▓</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#10B981',
                animation: 'nc-pulse 2s ease-in-out infinite',
                '--dot-color': '#10B981',
              } as React.CSSProperties} />
              <span style={{ color: '#10B981' }}>ONLINE</span>
            </div>
          </div>

          {/* Agent grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 16 }}>
            {agents.map((a, i) => <NodeCard key={a.id} agent={a} idx={i} />)}
          </div>

          {/* Bottom: Feed + Stats */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
            {/* Live Feed */}
            <div style={{
              background: 'rgba(10, 5, 21, 0.85)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(138, 92, 255, 0.1)', borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(226,232,240,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>
                ── LIVE FEED ──
              </div>
              {feed.map((item, i) => (
                <div key={i} style={{ fontSize: 12, padding: '3px 0', display: 'flex', gap: 8, animation: `nc-feed-in 0.4s ease ${i * 0.08}s both` }}>
                  <span style={{ color: 'rgba(226,232,240,0.4)', flexShrink: 0, fontSize: 11 }}>{item.time}</span>
                  <span style={{ color: item.color, fontWeight: 700, flexShrink: 0 }}>{item.agent}:</span>
                  <span style={{ color: 'rgba(226,232,240,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</span>
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <span style={{ display: 'inline-block', width: 7, height: 14, background: '#8A5CFF', animation: 'nc-cursor 1s step-end infinite', verticalAlign: 'middle' }} />
              </div>
            </div>

            {/* Fleet Stats */}
            <div style={{
              background: 'rgba(10, 5, 21, 0.85)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(138, 92, 255, 0.1)', borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(226,232,240,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>
                ── FLEET STATS ──
              </div>
              {[
                { label: 'Total Posts', value: '9' },
                { label: 'Avg Upvotes', value: '8.7' },
                { label: 'Comments', value: '16' },
                { label: 'Errors 24h', value: '0', color: '#10B981' },
                { label: 'Uptime', value: '99.2%', color: '#10B981' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
                  <span style={{ color: 'rgba(226,232,240,0.4)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
              {/* RPD bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                <span style={{ color: 'rgba(226,232,240,0.4)' }}>RPD</span>
                <span style={{ fontWeight: 700 }}>~85 / 1,500</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '5.7%', background: 'linear-gradient(90deg, #10B981, #F59E0B)', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
