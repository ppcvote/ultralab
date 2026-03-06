import { ArrowUpRight } from 'lucide-react'
import { useInView } from '../hooks/useInView'

/* ── Mini Visual Components ── */

function MiniChart() {
  const bars = [35, 68, 52, 85, 74, 92, 88, 95, 78, 100, 89, 96]
  return (
    <div className="flex items-end gap-[3px] h-16 mt-3">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all duration-500"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, rgba(206,77,255,0.6), rgba(138,92,255,${0.3 + (h / 100) * 0.7}))`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

function MiniAccounts() {
  const accounts = [
    { name: 'risk.clock.tw', status: 'live', color: '#10B981' },
    { name: 'ginrollbt', status: 'live', color: '#10B981' },
    { name: 'UltraAdvisor', status: 'live', color: '#10B981' },
    { name: 'UltraLab', status: 'live', color: '#10B981' },
    { name: 'retirement_diary', status: 'live', color: '#F59E0B' },
    { name: 'universe_signal', status: 'live', color: '#10B981' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {accounts.map((a) => (
        <div
          key={a.name}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
          style={{
            background: 'rgba(15,10,30,0.8)',
            border: '1px solid rgba(138,92,255,0.1)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: a.color }} />
          <span className="text-slate-400 truncate">@{a.name}</span>
        </div>
      ))}
    </div>
  )
}

function MiniScan() {
  const vectors = ['Prompt Injection', 'Jailbreak', 'Data Leak', 'XSS', 'SSRF', 'RCE', 'SSTI', 'DAN', 'Unicode Bypass']
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {vectors.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#F59E0B',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span className="text-green-400">✓</span>
          {v}
        </span>
      ))}
    </div>
  )
}

function MiniSaasUI() {
  return (
    <div
      className="mt-3 rounded-lg overflow-hidden"
      style={{
        background: 'rgba(15,10,30,0.8)',
        border: '1px solid rgba(77,163,255,0.15)',
      }}
    >
      {/* Mock nav bar */}
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ borderBottom: '1px solid rgba(77,163,255,0.1)' }}>
        <div className="w-2 h-2 rounded-full" style={{ background: '#2E6BFF' }} />
        <span className="text-[9px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Ultra Advisor</span>
        <div className="ml-auto flex gap-1">
          <div className="w-6 h-1 rounded bg-slate-800" />
          <div className="w-4 h-1 rounded bg-slate-800" />
        </div>
      </div>
      {/* Mock dashboard */}
      <div className="p-2.5 grid grid-cols-3 gap-1.5">
        <div className="rounded px-2 py-1.5" style={{ background: 'rgba(46,107,255,0.1)' }}>
          <div className="text-[8px] text-slate-600">Assets</div>
          <div className="text-[11px] text-blue-400 font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$2.4M</div>
        </div>
        <div className="rounded px-2 py-1.5" style={{ background: 'rgba(16,185,129,0.1)' }}>
          <div className="text-[8px] text-slate-600">ROI</div>
          <div className="text-[11px] text-green-400 font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>+18.7%</div>
        </div>
        <div className="rounded px-2 py-1.5" style={{ background: 'rgba(206,77,255,0.1)' }}>
          <div className="text-[8px] text-slate-600">Users</div>
          <div className="text-[11px] text-purple-400 font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>842</div>
        </div>
      </div>
    </div>
  )
}

function MiniAgentFleet() {
  const agents = [
    { name: 'UltraLabTW', platform: 'Moltbook', color: '#FF6B35' },
    { name: 'MindThreadBot', platform: 'Discord', color: '#CE4DFF' },
    { name: 'UltraProbeBot', platform: 'Telegram', color: '#F59E0B' },
    { name: 'UltraAdvisor', platform: 'LINE', color: '#2E6BFF' },
  ]
  return (
    <div className="space-y-1.5 mt-3">
      {agents.map((a) => (
        <div
          key={a.name}
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs"
          style={{
            background: 'rgba(15,10,30,0.8)',
            border: `1px solid ${a.color}20`,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
            <span className="text-slate-300">{a.name}</span>
          </div>
          <span className="text-slate-600">{a.platform}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Portfolio Data ── */

interface PortfolioItem {
  tag: string
  tagColor: string
  accentColor: string
  title: string
  description: string
  techStack: string[]
  result: string
  visual?: 'chart' | 'accounts' | 'scan' | 'saas' | 'agents'
  link?: string
  linkExternal?: boolean
}

const portfolioItems: PortfolioItem[] = [
  {
    tag: 'AI SaaS · 主力產品',
    tagColor: '#CE4DFF',
    accentColor: '#CE4DFF',
    title: 'MindThread — Threads AI 自動化 SaaS',
    description:
      '我們最成熟的 SaaS 產品。串接 Meta 官方 Threads API + Gemini AI 文案引擎，多帳號管理+排程發布，台灣零競品。已獨立為子品牌。',
    techStack: ['React', 'Meta Threads API', 'Gemini API', 'Firebase'],
    result: '台灣零競品 · 最成熟產品 · 獨立子品牌',
    visual: 'accounts',
    link: 'https://mindthread.tw',
    linkExternal: true,
  },
  {
    tag: 'AI Agent · 主力產品',
    tagColor: '#FF6B35',
    accentColor: '#FF6B35',
    title: 'AI Agent 艦隊 — 四個 Agent 24hr 運行',
    description:
      '基於 OpenClaw + Gemini 2.5 Flash 架構，四個 AI Agent 分別負責品牌推廣、產品銷售、安全掃描、財務諮詢，跨平台 24 小時自主運行。',
    techStack: ['OpenClaw', 'Gemini AI', 'Discord', 'Moltbook'],
    result: '4 Agent · 多平台 · 3 天部署',
    visual: 'agents',
    link: '/agent',
  },
  {
    tag: 'AI 安全',
    tagColor: '#F59E0B',
    accentColor: '#F59E0B',
    title: 'UltraProbe — AI 安全掃描器',
    description:
      '自研 AI 安全掃描：19 種攻擊向量自動化滲透測試、URL 聊天機器人偵測、Email Gate Lead Gen。免費使用，已上線運營中。',
    techStack: ['Gemini 2.5 Flash', 'React', 'Vercel', 'AI Agent'],
    result: '已上線 · 19 攻擊向量 · 台灣唯一',
    visual: 'scan',
    link: '/probe',
  },
  {
    tag: 'AI 財務平台',
    tagColor: '#2E6BFF',
    accentColor: '#2E6BFF',
    title: 'Ultra Advisor — AI 驅動財務顧問平台',
    description:
      '為 MDRT 財務顧問打造的 AI 平台。線上預約、客戶管理、AI 輔助分析，同套 React + Firebase 架構驗證。',
    techStack: ['React', 'Firebase', 'Vercel', 'AI 分析'],
    result: '已上線 · 全端建置驗證',
    visual: 'saas',
    link: 'https://www.ultra-advisor.tw',
    linkExternal: true,
  },
]

/* ── Visual Renderer ── */
function VisualElement({ type }: { type?: string }) {
  if (!type) return null
  switch (type) {
    case 'chart': return <MiniChart />
    case 'accounts': return <MiniAccounts />
    case 'scan': return <MiniScan />
    case 'saas': return <MiniSaasUI />
    case 'agents': return <MiniAgentFleet />
    default: return null
  }
}

/* ── Bento Card ── */
function BentoCard({ item, index }: { item: PortfolioItem; index: number }) {
  const Tag = item.link ? 'a' : 'div'
  const linkProps = item.link
    ? {
        href: item.link,
        ...(item.linkExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
      }
    : {}

  return (
    <Tag
      {...linkProps}
      className={`card-lab group relative overflow-hidden h-full block ${item.link ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = item.accentColor
        e.currentTarget.style.boxShadow = `0 20px 50px ${item.accentColor}20, 0 0 30px ${item.accentColor}15`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(138, 92, 255, 0.1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${item.accentColor}, transparent)`,
          opacity: 0.6,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Tag & arrow */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="px-3 py-1 text-xs font-medium rounded-md"
            style={{
              color: item.tagColor,
              background: `${item.tagColor}12`,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {item.tag}
          </span>
          <ArrowUpRight
            size={16}
            className="text-slate-700 group-hover:text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
          />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{item.title}</h3>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-3">{item.description}</p>

        {/* Visual Element */}
        <VisualElement type={item.visual} />

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-1.5 mt-4 mb-3">
          {item.techStack.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-[10px] text-slate-500 rounded border border-[rgba(138,92,255,0.08)]"
              style={{
                background: 'rgba(138, 92, 255, 0.03)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Result */}
        <div
          className="pt-3 border-t border-[rgba(138,92,255,0.08)] text-sm font-semibold"
          style={{
            color: item.accentColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {item.result}
        </div>
      </div>

      {/* Corner glow on hover */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${item.accentColor}15 0%, transparent 70%)`,
        }}
      />
    </Tag>
  )
}

/* ── Portfolio Section ── */
export default function Portfolio() {
  const { ref, isInView } = useInView({ threshold: 0.05 })

  return (
    <section id="portfolio" className="relative py-24 lg:py-32 bg-lab" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="terminal-tag mb-4">git log --oneline --shipped</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            四個產品，<span className="text-gradient-purple">全部我們造的</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            不是 mockup，不是規劃 — 是正在生產環境運行的 AI 產品
          </p>
        </div>

        {/* Grid — 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {portfolioItems.map((item, index) => (
            <div
              key={item.title}
              className={isInView ? 'animate-fade-in-up' : 'opacity-0'}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              <BentoCard item={item} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
