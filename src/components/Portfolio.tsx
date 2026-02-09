import { ExternalLink } from 'lucide-react'
import { useInView } from '../hooks/useInView'

interface PortfolioItem {
  tag: string
  tagColor: string
  accentColor: string
  title: string
  description: string
  techStack: string[]
  result: string
}

const portfolioItems: PortfolioItem[] = [
  {
    tag: 'SaaS 建置',
    tagColor: '#2E6BFF',
    accentColor: '#2E6BFF',
    title: 'Ultra Advisor — 台灣最強財務顧問提案平台',
    description:
      '18+ 種財務數據視覺化工具，從零打造完整 SaaS 平台，含訂閱管理、點數經濟、LINE Bot 整合、管理後台。',
    techStack: ['React', 'TypeScript', 'Firebase', 'Vercel', 'LINE LIFF'],
    result: '18+ 工具上線 · 完整 SaaS 架構 · 已有付費用戶',
  },
  {
    tag: '社群自動化',
    tagColor: '#14B8A6',
    accentColor: '#14B8A6',
    title: '@ginrollbt — 全自動 Threads 經營',
    description:
      '用自建系統經營的 Threads 帳號，AI 自動生成內容、多帳號排程、全自動發布。',
    techStack: ['Node.js', 'Python', 'AI Content Gen'],
    result: '6.5K 粉絲 · 全自動運營 · 零人工干預',
  },
  {
    tag: '內容自動化',
    tagColor: '#10B981',
    accentColor: '#10B981',
    title: 'IG Reel 全自動產製線',
    description:
      '從素材到發布的端到端自動化。AI 生成文案、自動製作影片、排程發布，完全無需人工介入。',
    techStack: ['Node.js', 'Python', 'FFmpeg', 'AI'],
    result: '全自動流程 · 素材→發布 · 端到端',
  },
]

function PortfolioCard({ item, index }: { item: PortfolioItem; index: number }) {
  return (
    <div
      className="card-lab group relative overflow-hidden"
      style={{ animationDelay: `${index * 0.1}s` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = item.accentColor
        e.currentTarget.style.boxShadow = `0 0 30px ${item.accentColor}30`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(138, 92, 255, 0.15)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: item.accentColor }}
      />

      <div className="pl-4">
        {/* Tag & Link */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="px-3 py-1 text-xs font-medium rounded-md"
            style={{
              color: item.tagColor,
              background: `${item.tagColor}15`,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {item.tag}
          </span>
          <ExternalLink
            size={16}
            className="text-slate-600 group-hover:text-slate-400 transition-colors"
          />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{item.description}</p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.techStack.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-xs text-slate-500 rounded border border-[rgba(138,92,255,0.1)]"
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
          className="pt-3 border-t border-[rgba(138,92,255,0.1)] text-sm font-medium"
          style={{
            color: item.accentColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {item.result}
        </div>
      </div>
    </div>
  )
}

export default function Portfolio() {
  const { ref, isInView } = useInView({ threshold: 0.05 })

  return (
    <section id="portfolio" className="relative py-24 lg:py-32 bg-lab" ref={ref}>
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
            Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            實戰驗證，<span className="text-gradient-purple">不是紙上談兵</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            每一個服務都從自己的需求中誕生
          </p>
        </div>

        {/* Portfolio Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item, index) => (
            <div
              key={item.title}
              className={isInView ? 'animate-fade-in-up' : 'opacity-0'}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              <PortfolioCard item={item} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
