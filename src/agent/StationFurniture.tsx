/* ── Station Module Equipment ──
   Unique visual elements inside each station compartment.
   Like Colony's Furniture.tsx but for space station modules. */

const h2a = (h: string, a: number) => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ── Command Bridge (Main) ── */
function CommandBridge({ color }: { color: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Dual monitors */}
      <div style={{ position: 'absolute', top: 4, left: 6, width: 28, height: 18, borderRadius: 2,
        background: h2a(color, 0.08), border: `1px solid ${h2a(color, 0.25)}` }}
        className="ss-equip-screen"
      >
        {/* Screen content lines */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{ position: 'absolute', top: 4 + i * 5, left: 3, right: 3, height: 2,
            background: h2a(color, 0.15 + i * 0.08), borderRadius: 1 }} />
        ))}
      </div>
      <div style={{ position: 'absolute', top: 4, right: 6, width: 28, height: 18, borderRadius: 2,
        background: h2a(color, 0.08), border: `1px solid ${h2a(color, 0.25)}` }}
        className="ss-equip-screen"
      >
        {[0, 1, 2].map(i => (
          <div key={i} style={{ position: 'absolute', top: 4 + i * 5, left: 3, right: 3, height: 2,
            background: h2a(color, 0.12 + i * 0.06), borderRadius: 1 }} />
        ))}
      </div>

      {/* Holographic display (center) */}
      <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)' }}>
        <div className="ss-holo-ring" style={{
          width: 20, height: 20, borderRadius: '50%',
          border: `1.5px solid ${h2a(color, 0.4)}`,
          boxShadow: `0 0 8px ${h2a(color, 0.2)}, inset 0 0 6px ${h2a(color, 0.1)}`,
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 8, height: 8, borderRadius: '50%', background: h2a(color, 0.3),
          }} />
        </div>
      </div>

      {/* Command desk */}
      <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
        width: '70%', height: 6, borderRadius: 2,
        background: h2a(color, 0.1), border: `1px solid ${h2a(color, 0.15)}`,
      }}>
        {/* Desk LEDs */}
        {[0.2, 0.4, 0.6, 0.8].map(p => (
          <div key={p} className="ss-equip-led" style={{
            position: 'absolute', top: 1, left: `${p * 100}%`, width: 3, height: 3,
            borderRadius: '50%', background: h2a(color, 0.5),
          }} />
        ))}
      </div>

      {/* Status LED strip (left wall) */}
      <div style={{ position: 'absolute', top: 26, left: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[0.6, 0.4, 0.3].map((a, i) => (
          <div key={i} className="ss-equip-led" style={{
            width: 3, height: 3, borderRadius: '50%', background: h2a('#10B981', a),
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

/* ── Comms Center (Mind) ── */
function CommsCenter({ color }: { color: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Satellite dish */}
      <div style={{ position: 'absolute', top: 2, left: 8 }}>
        <div style={{
          width: 24, height: 12, borderRadius: '50% 50% 0 0',
          border: `1.5px solid ${h2a(color, 0.4)}`,
          borderBottom: 'none',
          background: h2a(color, 0.06),
        }} />
        <div style={{
          width: 2, height: 10, background: h2a(color, 0.3),
          margin: '0 auto',
        }} />
        {/* Signal waves */}
        <div className="ss-signal-wave" style={{
          position: 'absolute', top: -4, left: 6, width: 12, height: 12,
          borderRadius: '50%', border: `1px solid ${h2a(color, 0.2)}`,
        }} />
        <div className="ss-signal-wave" style={{
          position: 'absolute', top: -8, left: 2, width: 20, height: 20,
          borderRadius: '50%', border: `1px solid ${h2a(color, 0.1)}`,
          animationDelay: '0.5s',
        }} />
      </div>

      {/* Content queue display */}
      <div style={{ position: 'absolute', top: 3, right: 6, width: 32, height: 20, borderRadius: 2,
        background: h2a(color, 0.06), border: `1px solid ${h2a(color, 0.2)}` }}
        className="ss-equip-screen"
      >
        {/* Queue bars */}
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute', top: 3 + i * 4, left: 3, height: 2, borderRadius: 1,
            width: `${60 + Math.sin(i * 1.5) * 25}%`,
            background: h2a(color, 0.2 + i * 0.05),
          }} />
        ))}
      </div>

      {/* Metrics panel */}
      <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 4 }}>
        {['21', '35+', '4.2k'].map((v, i) => (
          <div key={i} style={{
            padding: '1px 4px', borderRadius: 2, fontSize: 6, fontWeight: 700,
            background: h2a(color, 0.1), border: `1px solid ${h2a(color, 0.15)}`,
            color: h2a(color, 0.6),
          }}>{v}</div>
        ))}
      </div>
    </div>
  )
}

/* ── Security Lab (Probe) ── */
function SecurityLab({ color }: { color: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Mini radar */}
      <div style={{ position: 'absolute', top: 4, left: 8 }}>
        <div className="ss-mini-radar" style={{
          width: 26, height: 26, borderRadius: '50%',
          border: `1.5px solid ${h2a(color, 0.3)}`,
          background: h2a(color, 0.04),
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Cross hair */}
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: h2a(color, 0.15) }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: h2a(color, 0.15) }} />
          {/* Sweep line */}
          <div className="ss-radar-mini-sweep" style={{
            position: 'absolute', top: '50%', left: '50%', width: '50%', height: 1,
            background: `linear-gradient(90deg, ${h2a(color, 0.5)}, transparent)`,
            transformOrigin: 'left center',
          }} />
          {/* Blips */}
          <div style={{ position: 'absolute', top: '30%', left: '60%', width: 3, height: 3, borderRadius: '50%',
            background: color, boxShadow: `0 0 4px ${color}`, opacity: 0.7 }} />
          <div style={{ position: 'absolute', top: '65%', left: '35%', width: 2, height: 2, borderRadius: '50%',
            background: color, opacity: 0.5 }} />
        </div>
      </div>

      {/* Alert light */}
      <div className="ss-alert-light" style={{
        position: 'absolute', top: 4, right: 10,
        width: 8, height: 8, borderRadius: '50%',
        background: h2a(color, 0.6),
        boxShadow: `0 0 8px ${h2a(color, 0.4)}`,
      }} />

      {/* Terminal screen */}
      <div style={{ position: 'absolute', top: 4, right: 22, width: 26, height: 18, borderRadius: 2,
        background: h2a(color, 0.06), border: `1px solid ${h2a(color, 0.2)}` }}
        className="ss-equip-screen"
      >
        {/* Scan output lines */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', top: 3 + i * 5, left: 2, right: 2, height: 2,
            background: i === 0 ? h2a(color, 0.3) : h2a(color, 0.12),
            borderRadius: 1,
            width: i === 0 ? '80%' : `${50 + i * 15}%`,
          }} />
        ))}
      </div>

      {/* Scan line overlay */}
      <div style={{ position: 'absolute', bottom: 2, left: 4, right: 4, height: 6, overflow: 'hidden',
        borderRadius: 2, background: h2a(color, 0.04), border: `1px solid ${h2a(color, 0.1)}` }}>
        <div className="ss-scan-bar" style={{
          width: '30%', height: '100%',
          background: `linear-gradient(90deg, transparent, ${h2a(color, 0.3)}, transparent)`,
        }} />
      </div>
    </div>
  )
}

/* ── Research Lab (Advisor) ── */
function ResearchLab({ color }: { color: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Bar chart */}
      <div style={{ position: 'absolute', top: 4, left: 6, display: 'flex', gap: 2, alignItems: 'flex-end', height: 22 }}>
        {[14, 20, 12, 18, 22, 16].map((h, i) => (
          <div key={i} className="ss-chart-bar" style={{
            width: 4, height: h, borderRadius: '1px 1px 0 0',
            background: h2a(color, 0.15 + i * 0.04),
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>

      {/* Data screen */}
      <div style={{ position: 'absolute', top: 3, right: 6, width: 30, height: 20, borderRadius: 2,
        background: h2a(color, 0.06), border: `1px solid ${h2a(color, 0.2)}` }}
        className="ss-equip-screen"
      >
        {/* Trend line */}
        <svg style={{ position: 'absolute', inset: 2 }} viewBox="0 0 26 16">
          <polyline
            points="0,12 4,10 8,14 12,8 16,6 20,9 24,4"
            fill="none"
            stroke={h2a(color, 0.4)}
            strokeWidth="1.5"
          />
          <circle cx="24" cy="4" r="1.5" fill={color} opacity="0.6" />
        </svg>
      </div>

      {/* Document stack */}
      <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 12, height: 8, borderRadius: 1,
            background: h2a(color, 0.08 + i * 0.03),
            border: `1px solid ${h2a(color, 0.12)}`,
            transform: `rotate(${(i - 1) * 3}deg)`,
          }} />
        ))}
      </div>

      {/* Calculator */}
      <div style={{ position: 'absolute', bottom: 2, right: 8, width: 14, height: 10, borderRadius: 1,
        background: h2a(color, 0.1), border: `1px solid ${h2a(color, 0.15)}` }}>
        <div style={{ position: 'absolute', top: 1, left: 1, right: 1, height: 3,
          background: h2a(color, 0.15), borderRadius: 1 }} />
      </div>
    </div>
  )
}

/* ── Export: render equipment by module ID ── */
export default function StationFurniture({ moduleId, color }: { moduleId: string; color: string }) {
  switch (moduleId) {
    case 'main':  return <CommandBridge color={color} />
    case 'mind':  return <CommsCenter color={color} />
    case 'probe': return <SecurityLab color={color} />
    case 'adv':   return <ResearchLab color={color} />
    default:      return null
  }
}
