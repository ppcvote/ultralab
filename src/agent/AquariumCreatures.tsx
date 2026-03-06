/* ── Aquarium Creatures ──
   Unique SVG sea creatures for each agent tank.
   Main: Octopus, Mind: Tropical Fish School, Probe: Anglerfish, Adv: Sea Turtle
   All animations driven by CSS keyframes in aquarium.css */

const h2a = (h: string, a: number) => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ── Octopus (Main — fluid, expressive, multi-armed) ── */
function Octopus({ color }: { color: string }) {
  return (
    <g style={{ animation: 'aq-octo-drift 10s ease-in-out infinite' }}>
      {/* Body glow */}
      <ellipse cx="50" cy="38" rx="18" ry="16" fill={h2a(color, 0.08)} />

      {/* Mantle (head) — breathing pulse */}
      <ellipse cx="50" cy="36" rx="14" ry="12" fill={h2a(color, 0.55)}
        stroke={h2a(color, 0.7)} strokeWidth="0.8"
        style={{ animation: 'aq-octo-pulse 4s ease-in-out infinite' }}
      />
      {/* Mantle highlight */}
      <ellipse cx="47" cy="32" rx="6" ry="4" fill={h2a('#ffffff', 0.06)} />

      {/* Eyes (blink + look around) */}
      <ellipse cx="44" cy="35" rx="3.5" ry="3" fill="white"
        style={{ animation: 'aq-octo-blink 6s ease-in-out infinite' }} />
      <ellipse cx="56" cy="35" rx="3.5" ry="3" fill="white"
        style={{ animation: 'aq-octo-blink 6s ease-in-out infinite', animationDelay: '0.1s' }} />
      {/* Pupils (look around) */}
      <circle cx="44.5" cy="35.5" r="1.8" fill="#1a1a2e"
        style={{ animation: 'aq-octo-eye-look 8s ease-in-out infinite' }} />
      <circle cx="56.5" cy="35.5" r="1.8" fill="#1a1a2e"
        style={{ animation: 'aq-octo-eye-look 8s ease-in-out infinite' }} />
      {/* Eye shine */}
      <circle cx="43.5" cy="34" r="0.8" fill={h2a('#ffffff', 0.7)} />
      <circle cx="55.5" cy="34" r="0.8" fill={h2a('#ffffff', 0.7)} />

      {/* Tentacles (each animates independently via CSS d: path) */}
      <path d="M38,48 Q30,58 26,66 Q24,72 28,68 Q26,74 30,70" fill="none"
        stroke={h2a(color, 0.5)} strokeWidth="2.8" strokeLinecap="round"
        style={{ animation: 'aq-tentacle-1 3.5s ease-in-out infinite' }} />
      <path d="M43,50 Q38,62 35,70 Q33,76 37,72" fill="none"
        stroke={h2a(color, 0.45)} strokeWidth="2.5" strokeLinecap="round"
        style={{ animation: 'aq-tentacle-2 4s ease-in-out infinite' }} />
      <path d="M50,51 Q48,64 46,72 Q44,78 48,74" fill="none"
        stroke={h2a(color, 0.45)} strokeWidth="2.5" strokeLinecap="round"
        style={{ animation: 'aq-tentacle-3 3.8s ease-in-out infinite' }} />
      <path d="M57,50 Q62,62 65,70 Q67,76 63,72" fill="none"
        stroke={h2a(color, 0.45)} strokeWidth="2.5" strokeLinecap="round"
        style={{ animation: 'aq-tentacle-4 4.2s ease-in-out infinite' }} />
      <path d="M62,48 Q70,58 74,66 Q76,72 72,68" fill="none"
        stroke={h2a(color, 0.5)} strokeWidth="2.8" strokeLinecap="round"
        style={{ animation: 'aq-tentacle-5 3.6s ease-in-out infinite' }} />

      {/* Suction cups on tentacles */}
      {[[28, 64], [35, 68], [47, 70], [63, 68], [72, 64]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill={h2a(color, 0.25)} />
      ))}
      {[[30, 68], [37, 72], [48, 74], [64, 72], [71, 68]].map(([x, y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r="0.8" fill={h2a(color, 0.2)} />
      ))}

      {/* Spots (chromatophores) */}
      <circle cx="44" cy="40" r="1.8" fill={h2a(color, 0.25)}
        style={{ animation: 'aq-biolum 5s ease-in-out infinite' }} />
      <circle cx="55" cy="38" r="1.2" fill={h2a(color, 0.2)}
        style={{ animation: 'aq-biolum 5s ease-in-out infinite', animationDelay: '1s' }} />
      <circle cx="50" cy="43" r="1.5" fill={h2a(color, 0.2)}
        style={{ animation: 'aq-biolum 5s ease-in-out infinite', animationDelay: '2s' }} />
      <circle cx="42" cy="44" r="1" fill={h2a(color, 0.15)}
        style={{ animation: 'aq-biolum 5s ease-in-out infinite', animationDelay: '3s' }} />
    </g>
  )
}

/* ── Fish School (Mind — coordinated, lively, varied species) ── */
function FishSchool({ color }: { color: string }) {
  /* Each fish: pos, size, color, animation name, duration, delay */
  const fishes: { x: number; y: number; s: number; c: string; anim: string; dur: number; delay: string; flip?: boolean }[] = [
    { x: 32, y: 38, s: 3.2, c: color, anim: 'aq-fish-glide-1', dur: 5, delay: '0s' },
    { x: 52, y: 44, s: 2.8, c: '#5EEAD4', anim: 'aq-fish-glide-2', dur: 6, delay: '0.4s', flip: true },
    { x: 42, y: 54, s: 2.5, c: color, anim: 'aq-fish-glide-3', dur: 4.5, delay: '0.8s' },
    { x: 62, y: 36, s: 2.2, c: '#2DD4BF', anim: 'aq-fish-glide-4', dur: 5.5, delay: '1.2s' },
    { x: 25, y: 48, s: 2, c: '#99F6E4', anim: 'aq-fish-glide-1', dur: 6.5, delay: '1.6s' },
    { x: 55, y: 58, s: 1.8, c: color, anim: 'aq-fish-glide-3', dur: 4, delay: '2s', flip: true },
    { x: 70, y: 50, s: 2.4, c: '#14B8A6', anim: 'aq-fish-glide-4', dur: 5.2, delay: '0.6s', flip: true },
  ]

  return (
    <g>
      {fishes.map((f, i) => (
        <g key={i} style={{
          animation: `${f.anim} ${f.dur}s ease-in-out infinite`,
          animationDelay: f.delay,
        }}>
          <g transform={f.flip ? `translate(${f.x * 2}, 0) scale(-1, 1)` : undefined}>
            {/* Body */}
            <ellipse cx={f.x} cy={f.y} rx={f.s * 2.8} ry={f.s * 1.3}
              fill={h2a(f.c, 0.65)} stroke={h2a(f.c, 0.8)} strokeWidth="0.6" />
            {/* Tail (animated wag) */}
            <g style={{ transformOrigin: `${f.x + f.s * 2.5}px ${f.y}px`, animation: `aq-fish-tail ${0.4 + i * 0.05}s ease-in-out infinite` }}>
              <polygon
                points={`${f.x + f.s * 2.5},${f.y} ${f.x + f.s * 4.2},${f.y - f.s * 1.5} ${f.x + f.s * 4.2},${f.y + f.s * 1.5}`}
                fill={h2a(f.c, 0.45)} />
            </g>
            {/* Dorsal fin */}
            <path d={`M${f.x - f.s * 0.5},${f.y - f.s * 1.3} Q${f.x + f.s * 0.3},${f.y - f.s * 2.5} ${f.x + f.s * 1.5},${f.y - f.s * 1.3}`}
              fill={h2a(f.c, 0.35)} />
            {/* Pectoral fin */}
            <ellipse cx={f.x - f.s * 0.5} cy={f.y + f.s * 0.5} rx={f.s * 0.8} ry={f.s * 0.4}
              fill={h2a(f.c, 0.25)} transform={`rotate(15, ${f.x - f.s * 0.5}, ${f.y + f.s * 0.5})`} />
            {/* Eye */}
            <circle cx={f.x - f.s * 1.5} cy={f.y - f.s * 0.2} r={f.s * 0.55} fill="white" />
            <circle cx={f.x - f.s * 1.35} cy={f.y - f.s * 0.1} r={f.s * 0.3} fill="#1a1a2e" />
            {/* Body stripe */}
            <line x1={f.x - f.s * 0.3} y1={f.y - f.s * 1.1} x2={f.x - f.s * 0.3} y2={f.y + f.s * 1.1}
              stroke={h2a(f.c, 0.2)} strokeWidth={f.s * 0.25} />
            {/* Belly highlight */}
            <ellipse cx={f.x} cy={f.y + f.s * 0.3} rx={f.s * 1.5} ry={f.s * 0.4}
              fill={h2a('#ffffff', 0.06)} />
          </g>
        </g>
      ))}
    </g>
  )
}

/* ── Anglerfish (Probe — menacing, prowling, bioluminescent lure) ── */
function Anglerfish({ color }: { color: string }) {
  return (
    <g style={{ animation: 'aq-angler-prowl 12s ease-in-out infinite' }}>
      {/* Ambient glow from lure */}
      <circle cx="40" cy="18" r="15" fill={h2a(color, 0.06)}
        style={{ animation: 'aq-angler-light 3s ease-in-out infinite' }} />

      {/* Body (large, menacing) */}
      <ellipse cx="50" cy="50" rx="18" ry="13" fill={h2a(color, 0.5)}
        stroke={h2a(color, 0.6)} strokeWidth="1" />
      {/* Body texture */}
      <ellipse cx="50" cy="50" rx="15" ry="10" fill="none"
        stroke={h2a(color, 0.15)} strokeWidth="0.5" strokeDasharray="2 3" />

      {/* Lower jaw (animated snap) */}
      <path d="M34,56 Q42,62 50,63 Q58,62 66,56" fill={h2a(color, 0.35)}
        stroke={h2a(color, 0.5)} strokeWidth="0.8"
        style={{ animation: 'aq-angler-jaw 8s ease-in-out infinite' }} />

      {/* Teeth (upper) */}
      {[35, 39, 43, 47, 53, 57, 61, 65].map((x, i) => (
        <line key={`u${i}`} x1={x} y1={53} x2={x + (x < 50 ? 0.5 : -0.5)} y2={55 + (i % 2) * 2}
          stroke={h2a('#ffffff', 0.7)} strokeWidth="0.8" strokeLinecap="round" />
      ))}
      {/* Teeth (lower — pointing up) */}
      {[37, 42, 47, 53, 58, 63].map((x, i) => (
        <line key={`l${i}`} x1={x} y1={57} x2={x} y2={55 - (i % 2)}
          stroke={h2a('#ffffff', 0.5)} strokeWidth="0.7" strokeLinecap="round" />
      ))}

      {/* Giant eye */}
      <circle cx="41" cy="46" r="5.5" fill={h2a('#ffffff', 0.9)} />
      <circle cx="42" cy="46" r="3.5" fill={h2a(color, 0.9)} />
      <circle cx="42.5" cy="45.5" r="2" fill="#1a1a2e" />
      <circle cx="40.5" cy="44.5" r="1" fill={h2a('#ffffff', 0.5)} />
      {/* Iris veins */}
      <line x1="39" y1="46" x2="38" y2="46.5" stroke={h2a(color, 0.3)} strokeWidth="0.3" />
      <line x1="39.5" y1="44" x2="38.5" y2="43.5" stroke={h2a(color, 0.3)} strokeWidth="0.3" />

      {/* Lure stalk (animated swing) */}
      <path d="M40,38 Q33,26 38,18" fill="none"
        stroke={h2a(color, 0.4)} strokeWidth="1.5" strokeLinecap="round"
        style={{ animation: 'aq-lure-swing 4s ease-in-out infinite' }} />
      {/* Lure light (intense pulse) */}
      <circle cx="38" cy="18" r="4" fill={h2a(color, 0.3)}
        style={{ animation: 'aq-angler-light 3s ease-in-out infinite' }} />
      <circle cx="38" cy="18" r="2" fill={color}
        style={{ animation: 'aq-angler-inner-light 2s ease-in-out infinite' }} />
      {/* Light rays from lure */}
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <line key={deg}
          x1={38 + Math.cos(deg * Math.PI / 180) * 5}
          y1={18 + Math.sin(deg * Math.PI / 180) * 5}
          x2={38 + Math.cos(deg * Math.PI / 180) * 8}
          y2={18 + Math.sin(deg * Math.PI / 180) * 8}
          stroke={h2a(color, 0.15)} strokeWidth="0.5"
          style={{ animation: 'aq-angler-light 3s ease-in-out infinite', animationDelay: `${deg / 360}s` }}
        />
      ))}

      {/* Dorsal spines */}
      {[44, 49, 54, 58].map((x, i) => (
        <line key={x} x1={x} y1={38} x2={x + 0.5} y2={32 - i * 0.5}
          stroke={h2a(color, 0.3)} strokeWidth="0.8" />
      ))}

      {/* Pectoral fin (animated) */}
      <ellipse cx="37" cy="56" rx="6" ry="3" fill={h2a(color, 0.3)}
        transform="rotate(-15, 37, 56)"
        style={{ transformOrigin: '40px 55px', animation: 'aq-angler-fin 3s ease-in-out infinite' }}
      />
      {/* Ventral fin */}
      <ellipse cx="55" cy="60" rx="4" ry="2" fill={h2a(color, 0.2)}
        transform="rotate(10, 55, 60)"
        style={{ transformOrigin: '53px 59px', animation: 'aq-angler-fin 3s ease-in-out infinite', animationDelay: '1.5s' }}
      />

      {/* Tail */}
      <path d="M68,50 Q74,46 77,40" fill="none" stroke={h2a(color, 0.4)} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M68,50 Q74,54 77,60" fill="none" stroke={h2a(color, 0.4)} strokeWidth="1.8" strokeLinecap="round" />
      {/* Tail membrane */}
      <path d="M77,40 Q78,50 77,60" fill={h2a(color, 0.15)} stroke={h2a(color, 0.25)} strokeWidth="0.5" />

      {/* Body bumps / texture */}
      {[[54, 44], [60, 48], [56, 54]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill={h2a(color, 0.15)} />
      ))}
    </g>
  )
}

/* ── Sea Turtle (Advisor — graceful, wise, steady swimmer) ── */
function SeaTurtle({ color }: { color: string }) {
  return (
    <g style={{ animation: 'aq-turtle-swim 10s ease-in-out infinite' }}>
      {/* Shell */}
      <ellipse cx="52" cy="48" rx="17" ry="13" fill={h2a(color, 0.4)}
        stroke={h2a(color, 0.6)} strokeWidth="1.2" />
      {/* Shell scutes (mosaic pattern) */}
      {/* Central column */}
      <rect x="48" y="38" width="8" height="8" rx="1.5" fill="none"
        stroke={h2a(color, 0.25)} strokeWidth="0.6" />
      <rect x="48" y="47" width="8" height="7" rx="1.5" fill="none"
        stroke={h2a(color, 0.25)} strokeWidth="0.6" />
      {/* Side scutes */}
      <path d="M48,40 Q43,38 40,42 Q41,47 48,46" fill="none" stroke={h2a(color, 0.2)} strokeWidth="0.5" />
      <path d="M56,40 Q61,38 64,42 Q63,47 56,46" fill="none" stroke={h2a(color, 0.2)} strokeWidth="0.5" />
      <path d="M48,49 Q43,48 40,52 Q42,56 48,54" fill="none" stroke={h2a(color, 0.2)} strokeWidth="0.5" />
      <path d="M56,49 Q61,48 64,52 Q62,56 56,54" fill="none" stroke={h2a(color, 0.2)} strokeWidth="0.5" />
      {/* Shell rim highlight */}
      <ellipse cx="52" cy="48" rx="17" ry="13" fill="none"
        stroke={h2a('#ffffff', 0.05)} strokeWidth="2" />

      {/* Head + Neck */}
      <g style={{ animation: 'aq-turtle-head-bob 5s ease-in-out infinite' }}>
        <ellipse cx="33" cy="46" rx="6.5" ry="5.5" fill={h2a(color, 0.45)}
          stroke={h2a(color, 0.55)} strokeWidth="0.8" />
        {/* Beak */}
        <path d="M27,46 Q26,45 27,44" fill="none" stroke={h2a(color, 0.5)} strokeWidth="1" strokeLinecap="round" />
        {/* Eye */}
        <circle cx="30.5" cy="44" r="2.2" fill="white" />
        <circle cx="30" cy="44" r="1.2" fill="#1a1a2e" />
        <circle cx="29.5" cy="43.5" r="0.5" fill={h2a('#ffffff', 0.5)} />
        {/* Smile */}
        <path d="M28.5,47.5 Q30.5,48.8 33,47.5" fill="none" stroke={h2a(color, 0.35)} strokeWidth="0.5" />
        {/* Head pattern */}
        <circle cx="34" cy="43" r="1" fill={h2a(color, 0.2)} />
        <circle cx="32" cy="49" r="0.8" fill={h2a(color, 0.15)} />
      </g>

      {/* Front flippers (power stroke animation) */}
      <g style={{ transformOrigin: '42px 40px', animation: 'aq-flipper-stroke 3.5s ease-in-out infinite' }}>
        <ellipse cx="36" cy="36" rx="10" ry="3.2" fill={h2a(color, 0.4)}
          stroke={h2a(color, 0.5)} strokeWidth="0.5"
          transform="rotate(-35, 36, 36)" />
        {/* Flipper ridges */}
        <line x1="33" y1="35" x2="29" y2="33" stroke={h2a(color, 0.2)} strokeWidth="0.4" />
        <line x1="35" y1="34" x2="31" y2="31" stroke={h2a(color, 0.2)} strokeWidth="0.4" />
      </g>
      <g style={{ transformOrigin: '42px 56px', animation: 'aq-flipper-stroke 3.5s ease-in-out infinite', animationDelay: '1.75s' }}>
        <ellipse cx="36" cy="60" rx="10" ry="3.2" fill={h2a(color, 0.4)}
          stroke={h2a(color, 0.5)} strokeWidth="0.5"
          transform="rotate(35, 36, 60)" />
        <line x1="33" y1="61" x2="29" y2="63" stroke={h2a(color, 0.2)} strokeWidth="0.4" />
      </g>

      {/* Rear flippers (smaller, gentle paddle) */}
      <g style={{ transformOrigin: '66px 42px', animation: 'aq-flipper-stroke-rear 4s ease-in-out infinite' }}>
        <ellipse cx="67" cy="41" rx="5.5" ry="2" fill={h2a(color, 0.3)}
          transform="rotate(-10, 67, 41)" />
      </g>
      <g style={{ transformOrigin: '66px 54px', animation: 'aq-flipper-stroke-rear 4s ease-in-out infinite', animationDelay: '2s' }}>
        <ellipse cx="67" cy="55" rx="5.5" ry="2" fill={h2a(color, 0.3)}
          transform="rotate(10, 67, 55)" />
      </g>

      {/* Tail */}
      <polygon points="69,48 75,46 74,48 75,50" fill={h2a(color, 0.3)} />
    </g>
  )
}

/* ── Flora: Seaweed ── */
export function Seaweed({ x, color, height = 30 }: { x: number; color: string; height?: number }) {
  const d = `${3 + Math.random() * 2}`
  return (
    <g style={{ transformOrigin: `${x}px 80px`, animation: `aq-seaweed-sway ${d}s ease-in-out infinite` }}>
      <path d={`M${x},80 Q${x - 5},${80 - height * 0.35} ${x - 2},${80 - height * 0.55} Q${x + 3},${80 - height * 0.75} ${x + 1},${80 - height * 0.9} Q${x - 1},${80 - height * 0.95} ${x},${80 - height}`}
        fill="none" stroke={h2a(color, 0.5)} strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M${x + 3},80 Q${x + 7},${80 - height * 0.25} ${x + 5},${80 - height * 0.5} Q${x + 3},${80 - height * 0.65} ${x + 4},${80 - height * 0.7}`}
        fill="none" stroke={h2a(color, 0.35)} strokeWidth="2" strokeLinecap="round" />
      {/* Leaves */}
      <ellipse cx={x - 3} cy={80 - height * 0.5} rx="3" ry="1.2" fill={h2a(color, 0.25)}
        transform={`rotate(-20, ${x - 3}, ${80 - height * 0.5})`} />
      <ellipse cx={x + 4} cy={80 - height * 0.35} rx="2.5" ry="1" fill={h2a(color, 0.2)}
        transform={`rotate(15, ${x + 4}, ${80 - height * 0.35})`} />
    </g>
  )
}

/* ── Flora: Coral ── */
export function Coral({ x, color }: { x: number; color: string }) {
  return (
    <g style={{ animation: 'aq-coral-pulse 4s ease-in-out infinite' }}>
      <line x1={x} y1={80} x2={x - 3} y2={67} stroke={h2a(color, 0.5)} strokeWidth="2" strokeLinecap="round" />
      <line x1={x} y1={80} x2={x + 4} y2={64} stroke={h2a(color, 0.5)} strokeWidth="2" strokeLinecap="round" />
      <line x1={x - 3} y1={67} x2={x - 7} y2={61} stroke={h2a(color, 0.4)} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={x - 3} y1={67} x2={x - 1} y2={60} stroke={h2a(color, 0.35)} strokeWidth="1.2" strokeLinecap="round" />
      <line x1={x + 4} y1={64} x2={x + 8} y2={58} stroke={h2a(color, 0.4)} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={x + 4} y1={64} x2={x + 2} y2={58} stroke={h2a(color, 0.35)} strokeWidth="1.2" strokeLinecap="round" />
      {/* Polyp tips (glowing) */}
      <circle cx={x - 7} cy={61} r="2" fill={h2a(color, 0.5)}
        style={{ animation: 'aq-biolum 3s ease-in-out infinite' }} />
      <circle cx={x - 1} cy={60} r="1.5" fill={h2a(color, 0.45)}
        style={{ animation: 'aq-biolum 3s ease-in-out infinite', animationDelay: '0.5s' }} />
      <circle cx={x + 8} cy={58} r="2" fill={h2a(color, 0.5)}
        style={{ animation: 'aq-biolum 3s ease-in-out infinite', animationDelay: '1s' }} />
      <circle cx={x + 2} cy={58} r="1.5" fill={h2a(color, 0.45)}
        style={{ animation: 'aq-biolum 3s ease-in-out infinite', animationDelay: '1.5s' }} />
    </g>
  )
}

/* ── Anemone (bonus flora) ── */
function Anemone({ x, color }: { x: number; color: string }) {
  return (
    <g>
      {/* Base */}
      <ellipse cx={x} cy={78} rx="4" ry="2" fill={h2a(color, 0.3)} />
      {/* Tentacles */}
      {[-6, -3, 0, 3, 6].map((dx, i) => (
        <path key={i}
          d={`M${x + dx * 0.5},78 Q${x + dx},${68 - i * 0.5} ${x + dx * 0.8},${64 - i * 0.3}`}
          fill="none" stroke={h2a(color, 0.35)} strokeWidth="1.2" strokeLinecap="round"
          style={{ transformOrigin: `${x + dx * 0.5}px 78px`, animation: `aq-seaweed-sway ${2.5 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
        />
      ))}
      {/* Tips */}
      {[-6, -3, 0, 3, 6].map((dx, i) => (
        <circle key={`t${i}`} cx={x + dx * 0.8} cy={64 - i * 0.3} r="1"
          fill={h2a(color, 0.5)}
          style={{ animation: 'aq-biolum 2s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </g>
  )
}

/* ── Bubbles ── */
export function Bubbles({ color, count = 5 }: { color: string; count?: number }) {
  // Use seeded positions (avoid random on re-render)
  const bubbles = Array.from({ length: count }).map((_, i) => ({
    cx: 12 + ((i * 37 + 13) % 76),
    r: 1 + ((i * 7 + 3) % 3),
    delay: (i * 0.8) % 5,
    dur: 3 + ((i * 5 + 2) % 4),
    wobDur: 2 + ((i * 3 + 1) % 2),
  }))

  return (
    <g>
      {bubbles.map((b, i) => (
        <g key={i}>
          <circle cx={b.cx} cy={72} r={b.r}
            fill="none" stroke={h2a(color, 0.2)} strokeWidth="0.5"
            style={{
              animation: `aq-bubble-rise ${b.dur}s ease-out infinite, aq-bubble-wobble ${b.wobDur}s ease-in-out infinite`,
              animationDelay: `${b.delay}s`,
            }}
          />
          {/* Bubble highlight */}
          <circle cx={b.cx - b.r * 0.3} cy={72 - b.r * 0.3} r={b.r * 0.3}
            fill={h2a('#ffffff', 0.15)}
            style={{
              animation: `aq-bubble-rise ${b.dur}s ease-out infinite`,
              animationDelay: `${b.delay}s`,
            }}
          />
        </g>
      ))}
    </g>
  )
}

/* ── Sandy Bottom ── */
export function SandyBottom({ color }: { color: string }) {
  return (
    <g>
      {/* Sand gradient */}
      <defs>
        <linearGradient id={`sand-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={h2a(color, 0.06)} />
          <stop offset="100%" stopColor={h2a(color, 0.12)} />
        </linearGradient>
      </defs>
      <rect x="0" y="73" width="100" height="7" fill={`url(#sand-${color.slice(1)})`} />
      {/* Sand ripples */}
      <path d="M5,76 Q15,74.5 25,76 Q35,77.5 45,76 Q55,74.5 65,76 Q75,77.5 85,76 Q95,74.5 100,76"
        fill="none" stroke={h2a(color, 0.08)} strokeWidth="0.5" />
      {/* Rocks */}
      <ellipse cx="22" cy="75.5" rx="3.5" ry="1.8" fill={h2a(color, 0.1)} />
      <ellipse cx="75" cy="76" rx="2.8" ry="1.5" fill={h2a(color, 0.08)} />
      <ellipse cx="88" cy="75" rx="2" ry="1" fill={h2a(color, 0.07)} />
    </g>
  )
}

/* ── Export: render creature by agent ID ── */
export default function AquariumCreature({ agentId, color }: { agentId: string; color: string }) {
  return (
    <svg viewBox="0 0 100 80" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <SandyBottom color={color} />
      <Bubbles color={color} count={7} />

      {/* Flora per tank */}
      {agentId === 'main' && <>
        <Seaweed x={14} color="#7C3AED" height={28} />
        <Seaweed x={84} color="#A78BFA" height={22} />
        <Coral x={72} color="#C084FC" />
        <Anemone x={25} color="#8B5CF6" />
      </>}
      {agentId === 'mind' && <>
        <Seaweed x={8} color="#14B8A6" height={26} />
        <Seaweed x={88} color="#5EEAD4" height={30} />
        <Coral x={18} color="#2DD4BF" />
        <Coral x={78} color="#14B8A6" />
        <Anemone x={55} color="#5EEAD4" />
      </>}
      {agentId === 'probe' && <>
        <Seaweed x={12} color="#7F1D1D" height={18} />
        <Seaweed x={90} color="#991B1B" height={14} />
        <Coral x={82} color="#B91C1C" />
      </>}
      {agentId === 'adv' && <>
        <Seaweed x={16} color="#B45309" height={26} />
        <Seaweed x={80} color="#D97706" height={22} />
        <Coral x={62} color="#F59E0B" />
        <Coral x={30} color="#FBBF24" />
        <Anemone x={45} color="#FCD34D" />
      </>}

      {/* Creature */}
      {agentId === 'main' && <Octopus color={color} />}
      {agentId === 'mind' && <FishSchool color={color} />}
      {agentId === 'probe' && <Anglerfish color={color} />}
      {agentId === 'adv' && <SeaTurtle color={color} />}
    </svg>
  )
}
