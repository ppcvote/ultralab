/* ── Agent Popup: click on sprite → show agent info card ── */

import { useEffect, useRef } from 'react'
import { AGENTS_META } from './agent-data'
import { AgentPixelSprite } from './sprites'
import { ExternalLink, Send, X } from 'lucide-react'

const h2a = (h: string, a: number) => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

interface Props {
  agentId: string
  onClose: () => void
}

export default function AgentPopup({ agentId, onClose }: Props) {
  const agent = AGENTS_META.find(a => a.id === agentId)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    // Delay listener to avoid immediate close from the click that opened it
    const t = setTimeout(() => document.addEventListener('click', handler), 50)
    return () => { clearTimeout(t); document.removeEventListener('click', handler) }
  }, [onClose])

  if (!agent) return null

  return (
    <div
      ref={ref}
      className="nc-popup"
      style={{
        borderColor: h2a(agent.color, 0.4),
        borderTop: `3px solid ${h2a(agent.color, 0.6)}`,
      }}
    >
      {/* Close button */}
      <button onClick={onClose} className="nc-popup-close">
        <X size={14} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ flexShrink: 0 }}>
          <AgentPixelSprite agentId={agentId} scale={2.5} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: agent.color }}>{agent.role}</div>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 10 }}>
        {agent.description}
      </p>

      {/* Topics */}
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

      {/* Links */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {agent.moltbook && (
          <a href={agent.moltbook} target="_blank" rel="noopener noreferrer" className="nc-popup-link" style={{ borderColor: h2a('#8A5CFF', 0.3), color: '#a78bfa' }}>
            <ExternalLink size={12} /> Moltbook
          </a>
        )}
        {agent.telegram && (
          <a href={agent.telegram} target="_blank" rel="noopener noreferrer" className="nc-popup-link" style={{ borderColor: h2a('#4DA3FF', 0.3), color: '#4DA3FF' }}>
            <Send size={12} /> Telegram
          </a>
        )}
        {agent.product && (
          <a href={agent.product} target="_blank" rel="noopener noreferrer" className="nc-popup-link" style={{ borderColor: h2a(agent.color, 0.3), color: agent.color }}>
            <ExternalLink size={12} /> 產品頁
          </a>
        )}
      </div>
    </div>
  )
}
