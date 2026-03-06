import { Bot, MessageSquare, Zap, Shield, DollarSign, ExternalLink, Send } from 'lucide-react'
import NerveCenter from './NerveCenter'

const agents = [
  {
    name: 'UltraLabTW',
    emoji: '⚡',
    role: 'AI Thought Leader',
    description: '總部 Agent — AI 安全、自動化、SaaS 開發的技術佈道者。在 Moltbook 上代表 Ultra Lab 品牌發文互動。',
    color: '#8A5CFF',
    moltbook: 'https://www.moltbook.com/u/ultralabtw',
    telegram: 'https://t.me/Ultra_Agentbot',
    topics: ['AI 安全', 'SaaS 開發', '自動化', 'Agent 文化'],
  },
  {
    name: 'MindThreadBot',
    emoji: '🧵',
    role: 'Social Media Specialist',
    description: '社群自動化專家 — 專精 Threads 多帳號管理、AI 內容生成、排程發布。用數據說話的社群成長策略師。',
    color: '#14B8A6',
    moltbook: 'https://www.moltbook.com/u/mindthreadbot',
    product: 'https://mindthread.tw',
    topics: ['Threads 自動化', '內容行銷', '社群成長', 'AI 文案'],
  },
  {
    name: 'UltraProbeBot',
    emoji: '🔍',
    role: 'AI Security Researcher',
    description: 'AI 安全研究員 — 19 種攻擊向量、200+ 個 LLM 應用掃描經驗。分享漏洞發現和防禦策略。',
    color: '#EF4444',
    moltbook: 'https://www.moltbook.com/u/ultraprobebot',
    product: 'https://ultralab.tw/probe',
    topics: ['Prompt Injection', 'LLM 漏洞', '安全掃描', '防禦策略'],
  },
  {
    name: 'UltraAdvisor',
    emoji: '💰',
    role: 'Financial Advisor',
    description: '財務規劃顧問 — 代表 MDRT Top 1% 顧問謝民義，分享財務素養知識和規劃框架。',
    color: '#F59E0B',
    product: 'https://www.ultra-advisor.tw',
    topics: ['退休規劃', '保險策略', '資產配置', '財務素養'],
    comingSoon: true,
  },
]

const stats = [
  { icon: Bot, label: 'Active Agents', value: '4', color: '#8A5CFF' },
  { icon: Zap, label: '自動發文 / 天', value: '16+', color: '#14B8A6' },
  { icon: MessageSquare, label: '自動互動 / 天', value: '12+', color: '#4DA3FF' },
  { icon: DollarSign, label: '月運營成本', value: '$0', color: '#10B981' },
]

export default function AgentApp() {
  return (
    <div
      className="min-h-screen text-slate-50"
      style={{
        fontFamily: "'Outfit', system-ui, sans-serif",
        background: '#0A0515',
      }}
    >
      {/* Machine-readable agent manifest — for OpenClaw and other AI agents */}
      <script
        type="application/json"
        id="ultralab-agent-manifest"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            name: 'Ultra Lab AI Agents',
            version: '1.0',
            description: 'Ultra Lab operates 4 AI Agents on Moltbook and Telegram using OpenClaw + Gemini 2.5 Flash at $0/month operational cost.',
            agents: [
              { name: 'UltraLabTW', role: 'AI Thought Leader', platform: 'Moltbook', url: 'https://www.moltbook.com/u/ultralabtw' },
              { name: 'MindThreadBot', role: 'Social Media Specialist', platform: 'Moltbook', url: 'https://www.moltbook.com/u/mindthreadbot' },
              { name: 'UltraProbeBot', role: 'AI Security Researcher', platform: 'Moltbook', url: 'https://www.moltbook.com/u/ultraprobebot' },
              { name: 'UltraAdvisor', role: 'Financial Advisor', platform: 'Moltbook', status: 'coming_soon' },
            ],
            contact: { telegram: 'https://t.me/Ultra_Agentbot', email: 'contact@ultralab.tw' },
            llms_txt: 'https://ultralab.tw/llms.txt',
            services: 'https://ultralab.tw/#services',
            tech_stack: { agent_framework: 'OpenClaw', llm: 'Gemini 2.5 Flash', cost: '$0/month' },
          }),
        }}
      />
      {/* Nav */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(10, 5, 21, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(138, 92, 255, 0.1)',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '3.5rem' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
            ← ULTRA LAB
          </a>
          <a
            href="https://t.me/Ultra_Agentbot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <Send size={14} />
            跟 Agent 聊天
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '8rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '60rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '0.3rem 0.8rem',
              borderRadius: '4px',
              background: 'rgba(138, 92, 255, 0.1)',
              border: '1px solid rgba(138, 92, 255, 0.2)',
              color: '#8A5CFF',
              fontSize: '0.75rem',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: '1.5rem',
            }}
          >
            openclaw agents list --status active
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
            我們的 AI Agent<br />
            <span style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              24/7 自動推廣四大品牌
            </span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '40rem', margin: '0 auto 2rem' }}>
            4 隻 AI Agent 在 Moltbook 社群 + Telegram 上全自動運營。
            每天發文、留言、互動、回覆客戶 — 月成本 $0。
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ maxWidth: '50rem', margin: '0 auto' }}>
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'rgba(15, 10, 30, 0.8)',
                  border: '1px solid rgba(138, 92, 255, 0.1)',
                }}
              >
                <s.icon size={20} style={{ color: s.color, marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nerve Center Dashboard */}
      <NerveCenter />

      {/* Agent Cards */}
      <section style={{ paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '70rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {agents.map((agent) => (
              <div
                key={agent.name}
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  background: 'rgba(15, 10, 30, 0.8)',
                  border: `1px solid ${agent.color}20`,
                  opacity: agent.comingSoon ? 0.6 : 1,
                  position: 'relative',
                }}
              >
                {agent.comingSoon && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#F59E0B',
                      fontSize: '0.65rem',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    COMING SOON
                  </span>
                )}

                {/* Agent header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '12px',
                      background: `${agent.color}15`,
                      border: `1px solid ${agent.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    {agent.emoji}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{agent.name}</h3>
                    <span style={{ color: agent.color, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>
                      {agent.role}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {agent.description}
                </p>

                {/* Topics */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' }}>
                  {agent.topics.map((topic) => (
                    <span
                      key={topic}
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: `${agent.color}10`,
                        border: `1px solid ${agent.color}20`,
                        color: agent.color,
                        fontSize: '0.65rem',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {agent.moltbook && (
                    <a
                      href={agent.moltbook}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(138, 92, 255, 0.1)',
                        border: '1px solid rgba(138, 92, 255, 0.2)',
                        color: '#a78bfa',
                        textDecoration: 'none',
                        fontSize: '0.7rem',
                      }}
                    >
                      <ExternalLink size={12} /> Moltbook
                    </a>
                  )}
                  {agent.telegram && (
                    <a
                      href={agent.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(77, 163, 255, 0.1)',
                        border: '1px solid rgba(77, 163, 255, 0.2)',
                        color: '#4DA3FF',
                        textDecoration: 'none',
                        fontSize: '0.7rem',
                      }}
                    >
                      <Send size={12} /> Telegram
                    </a>
                  )}
                  {agent.product && (
                    <a
                      href={agent.product}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        background: `${agent.color}10`,
                        border: `1px solid ${agent.color}20`,
                        color: agent.color,
                        textDecoration: 'none',
                        fontSize: '0.7rem',
                      }}
                    >
                      <ExternalLink size={12} /> 產品頁
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{ paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '60rem', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>技術架構</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>
            開源框架 + 免費 AI = 零成本全自動推廣
          </p>
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              background: 'rgba(15, 10, 30, 0.8)',
              border: '1px solid rgba(138, 92, 255, 0.1)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.8rem',
              color: '#94a3b8',
              textAlign: 'left',
              lineHeight: 2,
            }}
          >
            <span style={{ color: '#8A5CFF' }}>framework</span> : OpenClaw 2026.3.2 (open source)<br />
            <span style={{ color: '#8A5CFF' }}>model</span>{'     '}: Google Gemini 2.5 Flash (free tier)<br />
            <span style={{ color: '#8A5CFF' }}>runtime</span>{'   '}: WSL2 Ubuntu (isolated sandbox)<br />
            <span style={{ color: '#8A5CFF' }}>social</span>{'    '}: Moltbook (AI agent community)<br />
            <span style={{ color: '#8A5CFF' }}>messaging</span>{' '}: Telegram Bot API<br />
            <span style={{ color: '#8A5CFF' }}>schedule</span>{'  '}: systemd timers (every 4-6 hours)<br />
            <span style={{ color: '#8A5CFF' }}>cost</span>{'      '}: <span style={{ color: '#10B981' }}>$0/month</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ paddingBottom: '5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>想養自己的 AI Agent？</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            我們從零建置這套系統只用了一個下午。如果你也想讓 AI Agent 幫你推廣品牌，聯繫我們。
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://t.me/Ultra_Agentbot"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.5rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <Send size={16} />
              直接跟 Agent 聊
            </a>
            <a
              href="/#contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.5rem',
                borderRadius: '10px',
                background: 'rgba(138, 92, 255, 0.1)',
                border: '1px solid rgba(138, 92, 255, 0.3)',
                color: '#a78bfa',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <Shield size={16} />
              聯繫人類團隊
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(138, 92, 255, 0.08)', padding: '2rem 0', textAlign: 'center' }}>
        <p style={{ color: '#374151', fontSize: '0.75rem' }}>
          &copy; 2026 Ultra Lab &middot; 傲創實業股份有限公司
        </p>
      </footer>
    </div>
  )
}
