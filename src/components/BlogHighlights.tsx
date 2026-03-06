import { ArrowRight, Clock, Calendar } from 'lucide-react'
import { useInView } from '../hooks/useInView'

interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
  readTime: string
  accent: string
}

const featuredPosts: BlogPost[] = [
  {
    slug: 'ai-ready-architecture-guide',
    title: '為什麼你的 SaaS 需要「預留 AI 接口」？',
    description: '從只用 Gemini 到 Multi-LLM 容錯架構 — 三個產品踩過的坑、學到的事、以及你現在就該做的 7 件事。',
    date: '2026-03-05',
    tags: ['AI 架構', 'Multi-LLM'],
    readTime: '12 min',
    accent: '#8A5CFF',
  },
  {
    slug: 'ultraprobe-launch',
    title: 'UltraProbe 上線 — 5 秒找出 LLM 漏洞',
    description: '90% 的 AI 系統存在 Prompt Injection 漏洞。這是我們自研的免費掃描工具，12 種攻擊向量自動化滲透。',
    date: '2026-02-28',
    tags: ['AI 安全', 'UltraProbe'],
    readTime: '8 min',
    accent: '#F59E0B',
  },
  {
    slug: 'ai-automation-survival-strategy',
    title: 'AI 自動化創業的三個生存陷阱',
    description: '平台依賴、感性包裝、技術護城河的真相 — 當你的整個事業建立在別人的 API 上，你真的安全嗎？',
    date: '2026-02-10',
    tags: ['AI 策略', '創業'],
    readTime: '10 min',
    accent: '#CE4DFF',
  },
  {
    slug: 'openclaw-ai-agent-setup',
    title: '從零部署 AI Agent：OpenClaw 實戰',
    description: '一個下午在 WSL2 裡部署 AI Agent，接通 Moltbook 社群 + Telegram，用 Gemini 免費運行。',
    date: '2026-03-05',
    tags: ['AI Agent', 'OpenClaw'],
    readTime: '12 min',
    accent: '#14B8A6',
  },
]

export default function BlogHighlights() {
  const { ref, isInView } = useInView({ threshold: 0.05 })

  return (
    <section ref={ref} className="relative py-24 lg:py-32 bg-lab">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="terminal-tag mb-4">cat /blog --latest --verified</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            我們不只做 AI，<span className="text-gradient-purple">我們寫 AI</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            從架構設計到踩坑紀錄 — 15 篇深度技術文章，零 AI 生成廢話
          </p>
        </div>

        {/* Blog Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredPosts.map((post, index) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className={`card-lab group block h-full transition-all duration-300 hover:-translate-y-1 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = post.accent
                e.currentTarget.style.boxShadow = `0 12px 40px ${post.accent}20`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(138, 92, 255, 0.1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{
                      color: post.accent,
                      background: `${post.accent}10`,
                      border: `1px solid ${post.accent}25`,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-purple-300 transition-colors">
                {post.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">
                {post.description}
              </p>

              {/* Meta */}
              <div
                className="mt-auto flex items-center gap-3 text-[11px] text-slate-600"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {post.readTime}
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* View All CTA */}
        <div className={`text-center mt-10 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
          <a
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors group"
          >
            查看全部 15 篇文章
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  )
}
