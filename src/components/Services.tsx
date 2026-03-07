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
    title: 'Threads 自動化 SaaS',
    tagline: 'MindThread — AI 文案 × 智能排程 × 數據優化',
    description:
      '串接 Meta 官方 Threads API + Gemini AI 文案引擎。5 種高互動公式自動生成內容、多帳號智能排程、基於互動數據的提示詞自動優化 — 讓每一篇貼文都比上一篇更好。已服務 20+ 帳號、日產 50+ 篇。v1.0 正式版上線中。',
    tags: ['MindThread v1.0', 'AI 文案', '智能排程', 'Agent API'],
    aiReady: '互動數據分析 · 提示詞自動優化 · Agent-Ready API · 加密貨幣支付',
    link: 'https://mindthread.tw',
    linkLabel: '前往 MindThread',
    external: true,
  },
  {
    icon: <Bot size={28} />,
    color: '#FF6B35',
    glowColor: 'rgba(255, 107, 53, 0.4)',
    title: 'AI Agent 品牌部署',
    tagline: '三天上線，$0/月運營，24hr 自主運行',
    description:
      'OpenClaw + Gemini 2.5 Flash 架構，每月 $0 運營成本。部署在 Moltbook、Discord、Telegram、LINE，Agent 自主發文、互動回覆、跨平台導流。Ultra Lab 的四個 Agent 日產 16+ 篇、12+ 次互動，就是活 demo。',
    tags: ['OpenClaw', '$0/月', '多平台', '三天上線'],
    aiReady: '策略感知發文 · 跨 Agent 協作 · 品牌聲音克隆 · 夥伴分潤',
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
      'React + TypeScript + Firebase + Vercel，含認證、訂閱管理、管理後台、LLM 整合。MindThread、Ultra Advisor 全部同套架構驗證 — 我們能幫你也造一個。',
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
