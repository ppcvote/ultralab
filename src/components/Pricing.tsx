import { Video, MessageSquare, Clapperboard, Code2, Sparkles, Globe, ArrowRight, Check, MessageCircle } from 'lucide-react'
import { useInView } from '../hooks/useInView'

interface ServicePlan {
  icon: React.ReactNode
  name: string
  desc: string
  price: string
  unit: string
  color: string
  features: string[]
}

const saasPlans: ServicePlan[] = [
  {
    icon: <Video size={20} />,
    name: 'IG Reel 自動發布',
    desc: '素材→文案→影片→排程→發布',
    price: 'NT$2,999',
    unit: '/月',
    color: '#10B981',
    features: ['AI 自動生成文案', '自動剪輯 + 上字幕', '排程發布到 IG', '數據追蹤儀表板'],
  },
  {
    icon: <MessageSquare size={20} />,
    name: 'Threads 多帳號自動化',
    desc: '多帳號排程 + AI 文案 + 自動發布',
    price: 'NT$1,990',
    unit: '/月',
    color: '#14B8A6',
    features: ['多帳號統一管理', 'AI 智能文案生成', '排程自動發布', '互動數據分析'],
  },
  {
    icon: <Clapperboard size={20} />,
    name: '短影音自動產製',
    desc: 'HTML 模板→Playwright→FFmpeg',
    price: 'NT$999',
    unit: '/月',
    color: '#FF3A3A',
    features: ['14-18 秒模板庫', '自動合成影片', '批量產製', 'API 串接可用'],
  },
]

const projectPlans: ServicePlan[] = [
  {
    icon: <Code2 size={20} />,
    name: 'SaaS 全端建置',
    desc: 'React + Firebase + Vercel 全套',
    price: 'NT$50,000',
    unit: '起',
    color: '#2E6BFF',
    features: ['需求分析 + 架構設計', '前後端完整開發', '部署 + CI/CD', '上線後 30 天維運'],
  },
  {
    icon: <Sparkles size={20} />,
    name: 'AI 串接應用',
    desc: 'Gemini / Claude API + Prompt 工程',
    price: 'NT$10,000',
    unit: '起',
    color: '#8A5CFF',
    features: ['API 串接 + 調校', 'Prompt 工程優化', '業務流程整合', '技術文件交付'],
  },
  {
    icon: <MessageCircle size={20} />,
    name: '技術諮詢',
    desc: '一對一諮詢，解決你的技術卡點',
    price: 'NT$3,000',
    unit: '/時',
    color: '#F59E0B',
    features: ['架構規劃建議', '技術選型評估', '自動化流程設計', '會後整理行動清單'],
  },
  {
    icon: <Globe size={20} />,
    name: '品牌官網全套',
    desc: '官網 + 表單 + 通知 + SEO + 部署',
    price: 'NT$30,000',
    unit: '起',
    color: '#4DA3FF',
    features: ['RWD 品牌官網設計', '客戶表單 + 即時通知', 'SEO + 數據追蹤', '網域設定 + 一年維運'],
  },
]

function PlanCard({ plan }: { plan: ServicePlan }) {
  return (
    <div className="card-lab h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${plan.color}15`, color: plan.color }}
        >
          {plan.icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{plan.name}</h3>
          <p className="text-xs text-slate-500">{plan.desc}</p>
        </div>
      </div>

      <div className="mb-5">
        <span
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {plan.price}
        </span>
        <span className="text-sm text-slate-500">{plan.unit}</span>
      </div>

      <div className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
            <span className="text-sm text-slate-400">{f}</span>
          </div>
        ))}
      </div>

      <a
        href="#contact"
        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold rounded-lg transition-all hover:-translate-y-0.5"
        style={{
          color: plan.color,
          border: `1px solid ${plan.color}40`,
          background: `${plan.color}08`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${plan.color}18`
          e.currentTarget.style.borderColor = plan.color
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${plan.color}08`
          e.currentTarget.style.borderColor = `${plan.color}40`
        }}
      >
        聯繫我們
        <ArrowRight size={14} />
      </a>
    </div>
  )
}

export default function Pricing() {
  const { ref, isInView } = useInView({ threshold: 0.05 })

  return (
    <section id="pricing" className="relative py-24 lg:py-32" ref={ref}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #0A0515 0%, #0D0820 50%, #0A0515 100%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span
            className="inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase rounded-full border border-[rgba(138,92,255,0.3)] text-[#CE4DFF] mb-4"
            style={{
              background: 'rgba(138, 92, 255, 0.08)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            透明報價，<span className="text-gradient-purple">沒有隱藏費用</span>
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            選擇適合你的方案，所有價格含稅，不滿意可隨時取消
          </p>
        </div>

        {/* SaaS 訂閱 */}
        <div className={`mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
          <h3
            className="text-xs text-slate-500 uppercase tracking-wider mb-5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            自動化工具 — 月訂閱
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {saasPlans.map((plan, i) => (
              <div
                key={plan.name}
                className={isInView ? 'animate-fade-in-up' : 'opacity-0'}
                style={{ animationDelay: `${(i + 1) * 0.1}s` }}
              >
                <PlanCard plan={plan} />
              </div>
            ))}
          </div>
        </div>

        {/* 專案服務 */}
        <div className={`${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <h3
            className="text-xs text-slate-500 uppercase tracking-wider mb-5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            技術服務 — 專案報價
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {projectPlans.map((plan, i) => (
              <div
                key={plan.name}
                className={isInView ? 'animate-fade-in-up' : 'opacity-0'}
                style={{ animationDelay: `${(i + 5) * 0.1}s` }}
              >
                <PlanCard plan={plan} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p
          className={`text-center text-xs text-slate-600 mt-10 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
          style={{ animationDelay: '0.7s', fontFamily: "'JetBrains Mono', monospace" }}
        >
          需要客製化方案？直接聯繫我們，依需求報價
        </p>
      </div>
    </section>
  )
}
