/* ── Pixel Art Furniture for each room ──
   All positioned absolute within room container (% of room)
   Top-down RimWorld perspective, pure CSS divs
   Scaled 2.5-3x for product-grade visibility */

const h2a = (h: string, a: number) => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ── Shared furniture building blocks ── */
function Desk({ top, left, w, h, color }: { top: string; left: string; w: number; h: number; color: string }) {
  return <div style={{ position: 'absolute', top, left, width: w, height: h, background: h2a(color, 0.4), border: `1px solid ${h2a(color, 0.3)}`, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
}

function Screen({ top, left, color, delay = 0 }: { top: string; left: string; color: string; delay?: number }) {
  return <div className="nc-screen" style={{ position: 'absolute', top, left, width: 12, height: 8, background: h2a(color, 0.8), boxShadow: `0 0 6px ${h2a(color, 0.5)}`, borderRadius: 2, animationDelay: `${delay}s` }} />
}

function Chair({ top, left, color }: { top: string; left: string; color: string }) {
  return <div style={{ position: 'absolute', top, left, width: 14, height: 14, borderRadius: '50%', background: h2a(color, 0.25), border: `1px solid ${h2a(color, 0.2)}` }} />
}

function Led({ top, left, color, delay = 0 }: { top: string; left: string; color: string; delay?: number }) {
  return <div className="nc-led" style={{ position: 'absolute', top, left, width: 4, height: 4, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, animationDelay: `${delay}s` }} />
}

/* ═══════════════════════════════════════════
   COMMAND — ⚡ UltraLabTW's war room
   Strategic, commanding, triple monitors
   ═══════════════════════════════════════════ */
function CommandFurniture({ color }: { color: string }) {
  return <>
    {/* L-shaped command desk */}
    <Desk top="38%" left="12%" w={70} h={24} color={color} />
    <Desk top="50%" left="12%" w={24} h={36} color={color} />
    {/* Triple monitors */}
    <Screen top="32%" left="16%" color={color} delay={0} />
    <Screen top="32%" left="30%" color={color} delay={0.4} />
    <Screen top="32%" left="44%" color={color} delay={0.8} />
    {/* Command chair */}
    <Chair top="58%" left="26%" color={color} />
    {/* Strategic whiteboard */}
    <div style={{ position: 'absolute', top: '10%', right: '8%', width: 52, height: 32, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 2 }}>
      {/* Whiteboard lines */}
      <div style={{ position: 'absolute', top: 6, left: 6, right: 6, height: 2, background: 'rgba(138,92,255,0.2)' }} />
      <div style={{ position: 'absolute', top: 12, left: 6, width: 28, height: 2, background: 'rgba(138,92,255,0.15)' }} />
      <div style={{ position: 'absolute', top: 18, left: 6, width: 18, height: 2, background: 'rgba(138,92,255,0.1)' }} />
      <div style={{ position: 'absolute', top: 24, left: 6, width: 34, height: 2, background: 'rgba(138,92,255,0.08)' }} />
    </div>
    {/* Ultra Lab logo glow */}
    <div style={{ position: 'absolute', top: '10%', left: '6%', width: 14, height: 14, background: h2a(color, 0.4), boxShadow: `0 0 12px ${h2a(color, 0.3)}`, borderRadius: 2 }} />
    {/* Coffee mug + steam */}
    <div style={{ position: 'absolute', top: '44%', left: '56%' }}>
      <div style={{ width: 8, height: 8, background: '#4A3520', borderRadius: 2, border: '1px solid rgba(74,53,32,0.5)' }} />
      <div className="nc-steam" style={{ position: 'absolute', top: -5, left: 2, width: 4, height: 5 }} />
    </div>
    {/* Desk plant */}
    <div style={{ position: 'absolute', top: '40%', left: '68%' }}>
      <div style={{ width: 8, height: 5, background: 'rgba(80,56,36,0.6)', borderRadius: '0 0 2px 2px' }} />
      <div style={{ position: 'absolute', top: -5, left: -2, width: 12, height: 8, background: 'rgba(34,197,94,0.35)', borderRadius: '50%' }} />
    </div>
    {/* Pen holder */}
    <div style={{ position: 'absolute', top: '46%', left: '64%', width: 6, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: '1px 1px 0 0', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ position: 'absolute', top: -4, left: 1, width: 1, height: 5, background: h2a(color, 0.3), transform: 'rotate(-8deg)' }} />
      <div style={{ position: 'absolute', top: -3, left: 3, width: 1, height: 4, background: 'rgba(239,68,68,0.3)', transform: 'rotate(5deg)' }} />
    </div>
  </>
}

/* ═══════════════════════════════════════════
   SERVER ROOM — ⚙️ Shared sync area
   Server racks, LEDs, cables, central hub
   ═══════════════════════════════════════════ */
function ServerFurniture({ color }: { color: string }) {
  return <>
    {/* Server racks (3) */}
    {[12, 38, 64].map((left, i) => (
      <div key={i} style={{ position: 'absolute', top: '10%', left: `${left}%`, width: 18, height: 40, background: 'rgba(30,35,50,0.9)', border: `1px solid ${h2a(color, 0.25)}`, borderRadius: 2 }}>
        {/* Front panel */}
        <div style={{ position: 'absolute', top: 3, left: 2, right: 2, bottom: 3, background: h2a(color, 0.15) }} />
        {/* LEDs */}
        <Led top="6px" left="4px" color="#10B981" delay={i * 0.4} />
        <Led top="14px" left="4px" color={color} delay={i * 0.4 + 0.2} />
        <Led top="22px" left="4px" color="#10B981" delay={i * 0.4 + 0.5} />
        <Led top="30px" left="4px" color={color} delay={i * 0.4 + 0.7} />
      </div>
    ))}
    {/* Central hub */}
    <div className="nc-server-hub" style={{
      position: 'absolute', top: '58%', left: '50%', transform: 'translate(-50%, -50%)',
      width: 22, height: 22, background: h2a(color, 0.25),
      border: `1.5px solid ${h2a(color, 0.35)}`, borderRadius: 3,
    }} />
    {/* Floor cables */}
    <div style={{ position: 'absolute', bottom: '18%', left: '8%', width: '84%', height: 2, background: h2a(color, 0.15) }} />
    <div style={{ position: 'absolute', bottom: '24%', left: '16%', width: '68%', height: 2, background: h2a(color, 0.12) }} />
  </>
}

/* ═══════════════════════════════════════════
   SOCIAL HUB — 🧵 MindThreadBot's studio
   Ring light, laptop, sticky notes, coffee
   ═══════════════════════════════════════════ */
function SocialFurniture({ color }: { color: string }) {
  return <>
    {/* Creator desk */}
    <Desk top="33%" left="10%" w={52} h={24} color={color} />
    {/* Ring light */}
    <div className="nc-ring-light" style={{
      position: 'absolute', top: '20%', left: '68%',
      width: 28, height: 28, borderRadius: '50%',
      border: `2px solid ${h2a(color, 0.6)}`,
      boxShadow: `0 0 10px ${h2a(color, 0.2)}, inset 0 0 4px ${h2a(color, 0.1)}`,
    }} />
    {/* Laptop */}
    <div style={{ position: 'absolute', top: '34%', left: '14%', width: 16, height: 12, background: h2a(color, 0.6), borderRadius: '2px 2px 0 0', boxShadow: `0 0 4px ${h2a(color, 0.3)}` }} />
    {/* Phone on stand */}
    <div style={{ position: 'absolute', top: '35%', left: '32%', width: 8, height: 12, background: h2a(color, 0.4), borderRadius: 2 }} />
    {/* Sticky notes wall (inspiration board) */}
    {[
      { t: '10%', l: '48%', bg: h2a(color, 0.4) },
      { t: '10%', l: '60%', bg: 'rgba(16,185,129,0.4)' },
      { t: '22%', l: '48%', bg: 'rgba(250,204,21,0.35)' },
      { t: '22%', l: '60%', bg: h2a(color, 0.3) },
    ].map((n, i) => (
      <div key={i} style={{ position: 'absolute', top: n.t, left: n.l, width: 14, height: 14, background: n.bg, borderRadius: 1 }} />
    ))}
    {/* Coffee cup */}
    <div style={{ position: 'absolute', top: '34%', left: '42%' }}>
      <div style={{ width: 8, height: 8, background: '#6B4226', borderRadius: 2, border: '1px solid rgba(107,66,38,0.5)' }} />
      <div className="nc-steam" style={{ position: 'absolute', top: -5, left: 2, width: 4, height: 5 }} />
    </div>
    {/* Chair */}
    <Chair top="54%" left="20%" color={color} />
    {/* Trend line chart on wall */}
    <div style={{ position: 'absolute', bottom: '10%', right: '6%', width: 36, height: 22, background: 'rgba(0,0,0,0.3)', border: `1px solid ${h2a(color, 0.15)}`, borderRadius: 2, overflow: 'hidden' }}>
      {/* Trend line (SVG) */}
      <svg width="36" height="22" viewBox="0 0 36 22" style={{ position: 'absolute', inset: 0 }}>
        <polyline points="2,18 8,14 14,16 20,8 26,10 32,4" fill="none" stroke={h2a(color, 0.5)} strokeWidth="1.5" />
        <circle cx="32" cy="4" r="2" fill={color} opacity={0.6} />
      </svg>
    </div>
    {/* Calendar icon */}
    <div style={{ position: 'absolute', bottom: '10%', left: '52%', width: 14, height: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
      <div style={{ height: 4, background: h2a(color, 0.3), borderRadius: '2px 2px 0 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, padding: '2px 1px' }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ width: 3, height: 2, background: 'rgba(255,255,255,0.08)' }} />)}
      </div>
    </div>
  </>
}

/* ═══════════════════════════════════════════
   SEC-LAB — 🔍 UltraProbeBot's hacker cave
   Scan-line monitors, scanner device, warning
   ═══════════════════════════════════════════ */
function SecLabFurniture({ color }: { color: string }) {
  return <>
    {/* L-shaped security console (facing wall) */}
    <Desk top="18%" left="8%" w={56} h={24} color={color} />
    <Desk top="30%" left="52%" w={24} h={28} color={color} />
    {/* Triple monitors with scan-line */}
    <Screen top="14%" left="12%" color={color} delay={0} />
    <Screen top="14%" left="26%" color={color} delay={0.3} />
    <Screen top="14%" left="40%" color={color} delay={0.6} />
    {/* Scan-line overlay on monitors */}
    <div className="nc-scanline" style={{ position: 'absolute', top: '14%', left: '12%', width: 48, height: 8 }} />
    {/* Scanner device (pulsing) */}
    <div className="nc-scanner" style={{
      position: 'absolute', top: '58%', right: '12%',
      width: 24, height: 24, borderRadius: '50%',
      background: h2a(color, 0.3),
      border: `1.5px solid ${h2a(color, 0.35)}`,
    }} />
    {/* Warning sign at door */}
    <div style={{
      position: 'absolute', top: '5%', right: '6%',
      width: 0, height: 0,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderBottom: '14px solid rgba(250,204,21,0.5)',
    }} />
    {/* Server tower in corner */}
    <div style={{ position: 'absolute', bottom: '10%', left: '6%', width: 14, height: 32, background: 'rgba(30,30,40,0.8)', border: `1px solid ${h2a(color, 0.2)}`, borderRadius: 2 }}>
      <Led top="6px" left="3px" color={color} delay={0.5} />
      <Led top="14px" left="3px" color="#10B981" delay={0.9} />
      <Led top="22px" left="3px" color={color} delay={1.3} />
    </div>
    {/* Chair */}
    <Chair top="36%" left="18%" color={color} />
    {/* Evidence board (detective strings) */}
    <div style={{ position: 'absolute', top: '8%', left: '58%', width: 34, height: 24, background: 'rgba(20,10,10,0.6)', border: `1px solid ${h2a(color, 0.15)}`, borderRadius: 2 }}>
      {/* Evidence photos */}
      <div style={{ position: 'absolute', top: 3, left: 3, width: 8, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', top: 3, left: 22, width: 8, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', top: 14, left: 12, width: 8, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
      {/* Red strings connecting evidence */}
      <svg width="34" height="24" viewBox="0 0 34 24" style={{ position: 'absolute', inset: 0 }}>
        <line x1="11" y1="6" x2="26" y2="6" stroke={h2a(color, 0.25)} strokeWidth="0.5" />
        <line x1="7" y1="9" x2="16" y2="17" stroke={h2a(color, 0.2)} strokeWidth="0.5" />
        <line x1="26" y1="9" x2="20" y2="17" stroke={h2a(color, 0.2)} strokeWidth="0.5" />
      </svg>
      {/* Push pins */}
      <div style={{ position: 'absolute', top: 1, left: 6, width: 3, height: 3, borderRadius: '50%', background: h2a(color, 0.5) }} />
      <div style={{ position: 'absolute', top: 1, left: 25, width: 3, height: 3, borderRadius: '50%', background: h2a(color, 0.5) }} />
    </div>
    {/* Terminal output on side monitor */}
    <div className="nc-screen-flash" style={{ position: 'absolute', top: '32%', left: '60%', width: 14, height: 10, background: h2a(color, 0.6), borderRadius: 1, boxShadow: `0 0 4px ${h2a(color, 0.3)}`, overflow: 'hidden' }}>
      {/* Fake terminal lines */}
      <div style={{ position: 'absolute', top: 2, left: 2, width: 8, height: 1, background: 'rgba(255,255,255,0.2)' }} />
      <div style={{ position: 'absolute', top: 4, left: 2, width: 5, height: 1, background: 'rgba(255,255,255,0.15)' }} />
      <div style={{ position: 'absolute', top: 6, left: 2, width: 9, height: 1, background: 'rgba(255,255,255,0.12)' }} />
    </div>
  </>
}

/* ═══════════════════════════════════════════
   ADVISORY — 💰 UltraAdvisor's office
   Meeting table, MDRT badge, charts, bookshelf
   ═══════════════════════════════════════════ */
function AdvisoryFurniture({ color }: { color: string }) {
  return <>
    {/* Meeting table (larger, centered) */}
    <Desk top="32%" left="22%" w={56} h={28} color={color} />
    {/* Advisor chair (behind table) */}
    <Chair top="24%" left="38%" color={color} />
    {/* Client chairs (front of table) */}
    <Chair top="56%" left="26%" color={color} />
    <Chair top="56%" left="48%" color={color} />
    {/* MDRT badge (amber glow) */}
    <div className="nc-trophy" style={{
      position: 'absolute', top: '8%', left: '8%',
      width: 16, height: 16, background: h2a(color, 0.5),
      border: `1.5px solid ${h2a(color, 0.6)}`,
      borderRadius: 2,
      boxShadow: `0 0 8px ${h2a(color, 0.35)}`,
    }} />
    {/* Wall chart (bar graph) */}
    <div style={{ position: 'absolute', top: '8%', right: '8%', display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
      <div style={{ width: 7, height: 14, background: h2a(color, 0.3), borderRadius: '2px 2px 0 0' }} />
      <div style={{ width: 7, height: 22, background: h2a(color, 0.4), borderRadius: '2px 2px 0 0' }} />
      <div style={{ width: 7, height: 32, background: h2a(color, 0.55), borderRadius: '2px 2px 0 0' }} />
      <div style={{ width: 7, height: 18, background: h2a(color, 0.35), borderRadius: '2px 2px 0 0' }} />
    </div>
    {/* Bookshelf / filing cabinet */}
    <div style={{ position: 'absolute', bottom: '8%', left: '6%', width: 28, height: 18, background: 'rgba(40,30,20,0.7)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 2 }}>
      {/* Book spines */}
      <div style={{ position: 'absolute', top: 2, left: 3, width: 5, height: 12, background: h2a(color, 0.3) }} />
      <div style={{ position: 'absolute', top: 2, left: 10, width: 5, height: 12, background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', top: 2, left: 17, width: 5, height: 12, background: h2a(color, 0.25) }} />
    </div>
    {/* Certificate frame on wall */}
    <div style={{ position: 'absolute', top: '8%', left: '38%', width: 22, height: 16, border: `1.5px solid ${h2a(color, 0.3)}`, borderRadius: 2, background: 'rgba(0,0,0,0.3)' }}>
      <div style={{ position: 'absolute', top: 3, left: 4, width: 14, height: 2, background: h2a(color, 0.2) }} />
      <div style={{ position: 'absolute', top: 7, left: 6, width: 10, height: 2, background: h2a(color, 0.15) }} />
      <div style={{ position: 'absolute', top: 11, left: 7, width: 8, height: 2, background: h2a(color, 0.1) }} />
    </div>
    {/* Calculator on desk */}
    <div style={{ position: 'absolute', top: '34%', left: '52%', width: 10, height: 14, background: 'rgba(30,25,40,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1 }}>
      <div style={{ position: 'absolute', top: 2, left: 2, width: 6, height: 3, background: 'rgba(16,185,129,0.3)', borderRadius: 1 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, padding: '7px 1px 1px' }}>
        {[...Array(9)].map((_, i) => <div key={i} style={{ width: 2, height: 2, background: 'rgba(255,255,255,0.06)' }} />)}
      </div>
    </div>
    {/* Desk phone */}
    <div style={{ position: 'absolute', top: '36%', left: '66%', width: 8, height: 12, background: 'rgba(25,20,35,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1 }}>
      <div style={{ position: 'absolute', top: 2, left: 2, width: 4, height: 3, background: h2a(color, 0.25), borderRadius: 1 }} />
    </div>
  </>
}

/* ── Router: render correct furniture by room ID ── */
export default function RoomFurniture({ roomId, color }: { roomId: string; color: string }) {
  switch (roomId) {
    case 'cmd': return <CommandFurniture color={color} />
    case 'srv': return <ServerFurniture color={color} />
    case 'soc': return <SocialFurniture color={color} />
    case 'sec': return <SecLabFurniture color={color} />
    case 'adv': return <AdvisoryFurniture color={color} />
    default: return null
  }
}
