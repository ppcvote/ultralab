import { Video, MessageSquare, Code2, Sparkles, Globe, Shield, BookOpen, Bot, ArrowRight } from 'lucide-react'
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
  // — 有獨立頁面的產品，放最上面 —
  {
    icon: <MessageSquare size={28} />,
    color: '#14B8A6',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    title: 'Threads 多帳號自動化系統',
    tagline: '已產品化為 Mind Threads SaaS',
    description:
      '串接 Meta 官方 Threads API + Gemini AI 文案生成引擎。6 帳號、35 篇/天全自動運行，已產品化為獨立 SaaS（台灣零競品）。',
    tags: ['Meta API', 'Gemini AI', '6帳號/35篇天', 'SaaS'],
    aiReady: 'Multi-LLM 切換 · 情緒分析 · 互動預測',
    link: 'https://mindthread.tw',
    linkLabel: '前往 Mind Threads',
    external: true,
  },
  {
    icon: <Shield size={28} />,
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    title: 'AI 資安防護服務',
    tagline: '你的 AI 系統，不該被反噬',
    description:
      '自研 UltraProbe AI 安全掃描器：12 種攻擊向量自動化滲透、Prompt Injection 防禦、多層輸入輸出驗證。已上線運營中。',
    tags: ['UltraProbe', '12攻擊向量', 'Prompt防禦', '自動化掃描'],
    aiReady: 'MCP Server · 即時監控 Webhook · 漏洞 RAG 知識庫',
    link: '/probe',
    linkLabel: '免費掃描',
  },
  {
    icon: <BookOpen size={28} />,
    color: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    title: 'Ultra KB 知識中樞建置',
    tagline: '30 分鐘 onboard 人類，0 秒 onboard AI',
    description:
      'Notion 知識庫全自動建置：產品資料庫、技術棧、API 文件、品牌規範、決策紀錄。70% 自動化匯入，Agent-Ready 架構。',
    tags: ['Notion', 'Agent-Ready', '70%自動化', 'Knowledge Base'],
    aiReady: 'MCP 讀寫接口 · RAG 語意搜尋 · AI Agent 可直接呼叫',
    link: '/kb',
    linkLabel: '查看方案',
  },
  {
    icon: <Bot size={28} />,
    color: '#FF6B35',
    glowColor: 'rgba(255, 107, 53, 0.4)',
    title: 'AI Agent 品牌部署服務',
    tagline: '讓 AI 幫你的品牌 24 小時發聲',
    description:
      '基於 OpenClaw + Gemini 2.5 Flash，幫品牌在 Moltbook、Telegram 部署可自主發文、互動、導流的 AI Agent。運營成本 $0/月，三天內上線。Ultra Lab 自己的四個 Agent 就是活案例。',
    tags: ['OpenClaw', 'Moltbook', 'Gemini AI', '$0/月運營'],
    aiReady: '品牌聲音克隆 · 多平台同步 · 自主互動策略',
    link: '/agent',
    linkLabel: '看我們的 Agents',
  },
  // — 其他服務 —
  {
    icon: <Video size={28} />,
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    title: 'IG Reel 全自動發布系統',
    tagline: '從素材到發布，全自動',
    description:
      'Gemini AI 生成文案 → FFmpeg 自動合成影片 → 排程 → 自動發布。端到端全自動的 IG Reel 運營系統，零人工介入。',
    tags: ['Gemini AI', 'FFmpeg', '排程發布', '零人工'],
    aiReady: 'AI 圖片生成 · AI 配音 · A/B 效果預測',
    link: '#portfolio',
    linkLabel: '看實際成果',
  },
  {
    icon: <Code2 size={28} />,
    color: '#2E6BFF',
    glowColor: 'rgba(46, 107, 255, 0.4)',
    title: 'SaaS 全端建置方案',
    tagline: '你的 SaaS，兩週上線',
    description:
      'React + TypeScript + Firebase + Vercel。已驗證的認證系統、訂閱管理、點數經濟、管理後台。內建 AI middleware 接口。',
    tags: ['全端', 'Firebase', '訂閱制', 'AI-Ready'],
    aiReady: 'AI Copilot 模組 · 智能儀表板 · 預測分析引擎',
    link: '#portfolio',
    linkLabel: '看 Ultra Advisor 案例',
  },
  {
    icon: <Sparkles size={28} />,
    color: '#8A5CFF',
    glowColor: 'rgba(138, 92, 255, 0.4)',
    title: 'AI 串接應用服務',
    tagline: '不只串 API，更懂你的業務',
    description:
      'Gemini / Claude / GPT 多模型路由 + Prompt Registry + RAG + 結構化輸出驗證。從保單 OCR 到 AI 安全掃描器的實戰架構。',
    tags: ['Multi-LLM', 'Prompt工程', 'RAG', 'MCP Server'],
    aiReady: 'Model Router · BYOK 架構 · AI Observability',
    link: '#contact',
    linkLabel: '免費諮詢',
  },
  {
    icon: <Globe size={28} />,
    color: '#4DA3FF',
    glowColor: 'rgba(77, 163, 255, 0.4)',
    title: '品牌官網全套方案',
    tagline: '不只是網站，是客戶獲取系統',
    description:
      '品牌官網 + 客戶表單 + 即時通知 + SEO 優化 + 數據追蹤 + 部署上線。一站搞定你的線上門面，預留 AI 擴展接口。',
    tags: ['RWD', 'SEO', '表單系統', 'AI-Ready'],
    aiReady: 'AI 客服 Chatbot · 智能表單 · 個人化內容',
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
          <span className="terminal-tag mb-4">ls --ai-services</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            八大 <span className="text-gradient-purple">AI 產品線</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            每一條產品線都由 AI 驅動 — 從 LLM 內容生成、Agent 部署到 AI 安全防護
          </p>
        </div>

        {/* Service Cards — 3x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
