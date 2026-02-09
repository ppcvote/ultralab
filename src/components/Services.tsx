import { Video, MessageSquare, Clapperboard, Code2, Sparkles, Globe, ArrowRight } from 'lucide-react'
import { useInView } from '../hooks/useInView'

interface Service {
  icon: React.ReactNode
  color: string
  glowColor: string
  title: string
  tagline: string
  description: string
  tags: string[]
}

const services: Service[] = [
  {
    icon: <Video size={28} />,
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    title: 'IG Reel 全自動發布系統',
    tagline: '從素材到發布，全自動',
    description:
      'AI 生成文案 → 自動製作影片 → 排程 → 自動發布。端到端全自動的 IG Reel 運營系統。',
    tags: ['全自動', 'AI文案', '排程發布', '零人工'],
  },
  {
    icon: <MessageSquare size={28} />,
    color: '#14B8A6',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    title: 'Threads 多帳號自動化系統',
    tagline: '多帳號 × AI 生成 × 全自動',
    description:
      '多帳號同時排程 + AI 自動生成內容 + 自動發布。Threads 無官方 API，能穩定運作的系統極為稀缺。',
    tags: ['多帳號', 'AI內容', '零競品', '先行者優勢'],
  },
  {
    icon: <Clapperboard size={28} />,
    color: '#FF3A3A',
    glowColor: 'rgba(255, 58, 58, 0.4)',
    title: '短影音自動產製系統',
    tagline: '14 秒打動人心',
    description:
      'HTML 動畫 → Playwright → FFmpeg 全流程自動化。含三類心理觸發模板（恐懼/效率/貪婪）。',
    tags: ['14-18秒', '心理觸發', '模板庫', '自動化'],
  },
  {
    icon: <Code2 size={28} />,
    color: '#2E6BFF',
    glowColor: 'rgba(46, 107, 255, 0.4)',
    title: 'SaaS 全端建置方案',
    tagline: '你的 SaaS，兩週上線',
    description:
      'React + TypeScript + Firebase + Vercel。已驗證的認證系統、訂閱管理、點數經濟、管理後台全套方案。',
    tags: ['全端', 'Firebase', '訂閱制', '管理後台'],
  },
  {
    icon: <Sparkles size={28} />,
    color: '#8A5CFF',
    glowColor: 'rgba(138, 92, 255, 0.4)',
    title: 'AI 串接應用服務',
    tagline: '不只串 API，更懂你的業務',
    description:
      'Gemini/Claude API 串接 + Prompt 工程 + 業務邏輯整合。從保單 OCR 到 AI 健檢報告的實戰方法論。',
    tags: ['Prompt工程', 'OCR', 'Gemini', '業務整合'],
  },
  {
    icon: <Globe size={28} />,
    color: '#4DA3FF',
    glowColor: 'rgba(77, 163, 255, 0.4)',
    title: '品牌官網全套方案',
    tagline: '不只是網站，是客戶獲取系統',
    description:
      '品牌官網 + 客戶表單 + 即時通知 + SEO 優化 + 數據追蹤 + 部署上線。一站搞定你的線上門面。',
    tags: ['RWD', 'SEO', '表單系統', '即時通知'],
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
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

      <div style={{ borderTop: '1px solid rgba(138, 92, 255, 0.1)', paddingTop: '16px' }}>
        <a
          href="#pricing"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: service.color }}
        >
          查看報價
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
          <span
            className="inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase rounded-full border border-[rgba(138,92,255,0.3)] text-[#CE4DFF] mb-4"
            style={{
              background: 'rgba(138, 92, 255, 0.08)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Services
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            六大<span className="text-gradient-purple">產品線</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            從社群自動化到 SaaS 建置，我們提供從驗證到量產的完整技術服務
          </p>
        </div>

        {/* Service Cards — 3x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
