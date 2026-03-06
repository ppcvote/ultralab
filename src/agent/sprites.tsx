/* ══════════════════════════════════════════════════════════════
   SVG Geometric Characters — Ultra Lab Agent Avatars
   Clean, cute, minimal geometric style. Each character uses
   circles, rounded rects, and simple paths for a polished look.
   ══════════════════════════════════════════════════════════════ */

import { memo } from 'react'

/* ── Character definitions ── */
interface AgentChar {
  /** Brand color */
  color: string
  /** Skin tone */
  skin: string
  /** Hair/accessory color */
  hair: string
  /** Unique accessory renderer */
  accessory: (color: string) => JSX.Element | null
  /** Body shape variant */
  bodyWidth: number
}

const AGENTS: Record<string, AgentChar> = {
  main: {
    color: '#8A5CFF',
    skin: '#DEB887',
    hair: '#2D1B4E',
    bodyWidth: 20,
    accessory: () => (
      <>
        {/* Styled swept hair */}
        <ellipse cx="24" cy="8" rx="11" ry="4" fill="#2D1B4E" />
        <ellipse cx="22" cy="7" rx="8" ry="3" fill="#1E0E3E" />
      </>
    ),
  },
  mind: {
    color: '#14B8A6',
    skin: '#B8D4E3',
    hair: '#0A3D3A',
    bodyWidth: 17,
    accessory: (color) => (
      <>
        {/* Headphones — arc + ear cups */}
        <path d="M13 12 Q13 3 24 3 Q35 3 35 12" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="11" y="10" width="4" height="6" rx="2" fill={color} />
        <rect x="33" y="10" width="4" height="6" rx="2" fill={color} />
        {/* Messy hair peeking under headphones */}
        <ellipse cx="24" cy="9" rx="9" ry="3" fill="#0A3D3A" />
      </>
    ),
  },
  probe: {
    color: '#EF4444',
    skin: '#8B9DAF',
    hair: '#5C1010',
    bodyWidth: 16,
    accessory: (color) => (
      <>
        {/* Hood — pointed top */}
        <path d="M14 16 L24 2 L34 16 Q34 10 24 9 Q14 10 14 16Z" fill="#5C1010" />
        <path d="M16 15 L24 5 L32 15 Q32 11 24 10 Q16 11 16 15Z" fill="#3D0A0A" />
        {/* Red visor across eyes */}
        <rect x="15" y="17" width="18" height="3" rx="1.5" fill={color} opacity="0.9" />
        <rect x="15" y="17" width="18" height="3" rx="1.5" fill="url(#visorGlow)" />
      </>
    ),
  },
  adv: {
    color: '#F59E0B',
    skin: '#D4A574',
    hair: '#5C3A10',
    bodyWidth: 18,
    accessory: () => (
      <>
        {/* Neat parted hair */}
        <ellipse cx="24" cy="8" rx="10" ry="4" fill="#7D5020" />
        <ellipse cx="22" cy="7.5" rx="7" ry="3.5" fill="#5C3A10" />
        {/* Part line */}
        <line x1="20" y1="5" x2="21" y2="10" stroke="#3A2510" strokeWidth="0.8" />
      </>
    ),
  },
}

/* ── Geometric Character Renderer ── */
const GeometricChar = memo(function GeometricChar({
  agentId,
  size = 80,
  frame = 0,
}: {
  agentId: string
  size?: number
  frame?: number
}) {
  const agent = AGENTS[agentId]
  if (!agent) return null

  const scale = size / 80 // base design is 48w × 80h
  const isStride = frame === 1

  return (
    <svg
      width={48 * scale}
      height={80 * scale}
      viewBox="0 0 48 80"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Visor glow for Probe */}
        <linearGradient id="visorGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF6666" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#FF0000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF6666" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* ── Accessory layer (behind or above head) ── */}
      {agent.accessory(agent.color)}

      {/* ── Head (circle) ── */}
      <circle cx="24" cy="16" r="10" fill={agent.skin} />
      <circle cx="24" cy="16" r="10" fill="none" stroke={agent.color} strokeWidth="1" opacity="0.3" />

      {/* ── Eyes ── */}
      {agentId !== 'probe' && (
        <>
          <circle cx="20" cy="16" r="1.8" fill="#1a1a2e" />
          <circle cx="28" cy="16" r="1.8" fill="#1a1a2e" />
          {/* Eye shine */}
          <circle cx="20.8" cy="15.2" r="0.6" fill="white" opacity="0.7" />
          <circle cx="28.8" cy="15.2" r="0.6" fill="white" opacity="0.7" />
        </>
      )}

      {/* ── Mouth — subtle smile ── */}
      {agentId !== 'probe' && (
        <path d="M21 20 Q24 22 27 20" fill="none" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.3" />
      )}

      {/* ── Neck ── */}
      <rect x="22" y="25" width="4" height="4" rx="1" fill={agent.skin} />

      {/* ── Body (rounded rect) ── */}
      <rect
        x={24 - agent.bodyWidth / 2}
        y="28"
        width={agent.bodyWidth}
        height="22"
        rx="4"
        fill={agent.color}
      />
      {/* Body inner highlight */}
      <rect
        x={24 - agent.bodyWidth / 2 + 2}
        y="30"
        width={agent.bodyWidth - 4}
        height="8"
        rx="2"
        fill="white"
        opacity="0.08"
      />

      {/* ── Advisor: golden tie ── */}
      {agentId === 'adv' && (
        <>
          <rect x="23" y="28" width="2" height="3" rx="0.5" fill="#E8E8E8" />
          <path d="M23 31 L24 38 L25 31Z" fill="#F59E0B" />
        </>
      )}

      {/* ── Advisor: white collar ── */}
      {agentId === 'adv' && (
        <>
          <path d="M18 29 L22 32 L22 28Z" fill="#E8E8E8" opacity="0.9" />
          <path d="M30 29 L26 32 L26 28Z" fill="#E8E8E8" opacity="0.9" />
        </>
      )}

      {/* ── Boss: white collar ── */}
      {agentId === 'main' && (
        <>
          <path d="M16 30 L20 33 L20 28Z" fill="#D4D4D8" opacity="0.8" />
          <path d="M32 30 L28 33 L28 28Z" fill="#D4D4D8" opacity="0.8" />
        </>
      )}

      {/* ── Arms (small rounded rects at sides) ── */}
      <rect
        x={24 - agent.bodyWidth / 2 - 4}
        y={isStride ? 30 : 32}
        width="4"
        height="12"
        rx="2"
        fill={agent.color}
        opacity="0.85"
      />
      <rect
        x={24 + agent.bodyWidth / 2}
        y={isStride ? 34 : 32}
        width="4"
        height="12"
        rx="2"
        fill={agent.color}
        opacity="0.85"
      />

      {/* ── Legs ── */}
      {isStride ? (
        <>
          {/* Stride pose: legs apart */}
          <rect x="17" y="49" width="5" height="18" rx="2.5" fill={agent.color} opacity="0.7" />
          <rect x="26" y="49" width="5" height="18" rx="2.5" fill={agent.color} opacity="0.7" />
          {/* Shoes */}
          <ellipse cx="19.5" cy="67" rx="3.5" ry="2.5" fill="#1a1a2e" />
          <ellipse cx="28.5" cy="67" rx="3.5" ry="2.5" fill="#1a1a2e" />
        </>
      ) : (
        <>
          {/* Standing pose: legs together */}
          <rect x="19" y="49" width="5" height="18" rx="2.5" fill={agent.color} opacity="0.7" />
          <rect x="24" y="49" width="5" height="18" rx="2.5" fill={agent.color} opacity="0.7" />
          {/* Shoes */}
          <ellipse cx="21.5" cy="67" rx="3.5" ry="2.5" fill="#1a1a2e" />
          <ellipse cx="26.5" cy="67" rx="3.5" ry="2.5" fill="#1a1a2e" />
        </>
      )}
    </svg>
  )
})

/* ── Exported component (same API as before) ── */
export function AgentPixelSprite({ agentId, scale, frame = 0 }: { agentId: string; scale?: number; frame?: number }) {
  // scale parameter maps to size: scale 3.5 = 80px height (default)
  const size = (scale ?? 3.5) * 80 / 3.5
  return <GeometricChar agentId={agentId} size={size} frame={frame} />
}
