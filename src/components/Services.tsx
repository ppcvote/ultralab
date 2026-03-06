import { Code2, MessageSquare, Bot, ArrowRight } from 'lucide-react'
import { useInView } from '../hooks/useInView'

interface Service {
  icon: React.ReactNode
  color: string
  glowColor: string
  title: string
  tagline: string
  description: string
  tags: string[]
  aiReady?: string
  link: string
  linkLabel: string
  external?: boolean
}

const services: Service[] = [
  {
    icon: <MessageSquare size={28} />,
    color: '#CE4DFF',
    glowColor: 'rgba(206, 77, 255, 0.4)',
    title: 'Threads / 社群自動化 SaaS',
    tagline: 'MindThread — 台灣零競品的 Threads AI 自動化',
    description:
      '串接 Meta 官方 Threads API + Gemini AI 文案引擎，多帳號管理、AI 生成內容、排程自動發布。已產品化為獨立 SaaS，是我們最成熟的產品。',
    tags: ['MindThread', 'Meta API', 'Gemini AI', 'SaaS'],
    aiReady: 'Multi-LLM 切換 · 情緒分析 · 互動預測',
    link: 'https://mindthread.tw',
    linkLabel: '前往 MindThread',
    external: true,
  },
  {
    icon: <Bot size={28} />,
    color: '#FF6B35',
    glowColor: 'rgba(255, 107, 53, 0.4)',
    title: 'AI Agent 品牌部署',
    tagline: '三天上線，讓 AI 替你的品牌 24 小時發聲',
    description:
      '基於 OpenClaw + Gemini 2.5 Flash，在 Moltbook、Discord、Telegram 部署可自主發文、互動、導流的 AI Agent。Ultra Lab 自己的四個 Agent 就是活案例。',
    tags: ['OpenClaw', 'Gemini AI', '多平台同步', '三天上線'],
    aiReady: '品牌聲音克隆 · 自主互動策略 · 跨平台協作',
    link: '/agent',
    linkLabel: '看我們的 Agents',
  },
  {
    icon: <Code2 size={28} />,
    color: '#2E6BFF',
    glowColor: 'rgba(46, 107, 255, 0.4)',
    title: 'AI 產品全端建置',
    tagline: '兩週上線 MVP，從概念到生產環境',
    description:
      'React + TypeScript + Firebase + Vercel，含認證、訂閱管理、管理後台。MindThread、Ultra Advisor 全部同套架構驗證，也能幫你造一個。',
    tags: ['全端', 'Firebase', 'LLM 整合', '兩週上線'],
    aiReady: 'AI Copilot 模組 · 智能儀表板 · 預測分析引擎',
    link: '#contact',
    linkLabel: '免費諮詢',
  },
]

function ServiceCard({ service }: { service: Service }) {
  return (
    <div
      className="card-lab group cursor-default h-full"
      style={{ borderColor: 'rgba(138, 92, 255, 0.15)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = service.color
        e.currentTarget.style.boxShadow = `0 0 30px ${service.glowColor}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(138, 92, 255, 0.15)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          background: `${service.color}15`,
          color: service.color,
        }}
      >
        {service.icon}
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{service.title}</h3>
      <p
        className="text-sm font-medium mb-3"
        style={{ color: service.color, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {service.tagline}
      </p>

      <p className="text-sm text-slate-400 leading-relaxed mb-4">{service.description}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: service.aiReady ? '12px' : '20px' }}>
        {service.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              color: service.color,
              border: `1px solid ${service.color}30`,
              background: `${service.color}08`,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {service.aiReady && (
        <div
          className="text-[11px] text-slate-500 mb-4 px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(138, 92, 255, 0.06)',
            border: '1px solid rgba(138, 92, 255, 0.12)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span className="text-purple-400 font-medium">AI-Ready</span>
          <span className="text-slate-600 mx-1.5">|</span>
          {service.aiReady}
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(138, 92, 255, 0.1)', paddingTop: '16px' }}>
        <a
          href={service.link}
          {...(service.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: service.color }}
        >
          {service.linkLabel}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </div>
  )
}

export default function Services() {
  const { ref, isInView } = useInView({ threshold: 0.05 })

  return (
    <section id="services" className="relative py-24 lg:py-32 bg-lab" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="terminal-tag mb-4">ls --core-capabilities</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            三大<span className="text-gradient-purple">核心能力</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            每一項能力都經自有產品驗證 — 造過才敢說會造
          </p>
        </div>

        {/* Service Cards — 3-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={isInView ? 'animate-fade-in-up' : 'opacity-0'}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
