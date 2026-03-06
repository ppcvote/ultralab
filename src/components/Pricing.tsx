import { Video, MessageSquare, Code2, Sparkles, Globe, Shield, BookOpen, ArrowRight, Check, MessageCircle } from 'lucide-react'
import { useInView } from '../hooks/useInView'
import { trackCTAClick } from '../lib/analytics'

interface ServicePlan {
  icon: React.ReactNode
  name: string
  desc: string
  price: string
  unit: string
  color: string
  features: string[]
  popular?: boolean
  link?: string
}

const saasPlans: ServicePlan[] = [
  {
    icon: <Video size={20} />,
    name: 'IG Reel 自動發布',
    desc: 'Gemini AI 文案 → FFmpeg 影片 → 排程發布',
    price: 'NT$2,999',
    unit: '/月',
    color: '#10B981',
    features: ['Gemini AI 自動生成文案', 'FFmpeg 自動剪輯 + 上字幕', '排程發布到 IG Reels + Story', '數據追蹤儀表板'],
  },
  {
    icon: <MessageSquare size={20} />,
    name: 'MindThread',
    desc: 'Meta API + Gemini AI 文案 + 多帳號自動發布',
    price: 'NT$1,990',
    unit: '/月起',
    color: '#14B8A6',
    features: ['多帳號統一管理', 'Gemini AI 文案生成 + 文案庫', '排程自動發布（Meta 官方 API）', '互動數據分析'],
    popular: true,
    link: 'https://mindthread.tw',
  },
]

const projectPlans: ServicePlan[] = [
  {
    icon: <Code2 size={20} />,
    name: 'SaaS 全端建置',
    desc: 'React + Firebase + Vercel + AI 整合',
    price: 'NT$50,000',
    unit: '起',
    color: '#2E6BFF',
    features: ['需求分析 + AI 架構設計', '前後端完整開發 + LLM 串接', '部署 + CI/CD + Vercel Edge', '上線後 30 天維運'],
  },
  {
    icon: <Sparkles size={20} />,
    name: 'AI 串接應用',
    desc: 'Gemini / Claude Multi-LLM + Prompt 工程',
    price: 'NT$10,000',
    unit: '起',
    color: '#8A5CFF',
    features: ['Multi-LLM API 串接 + 調校', 'Prompt 工程 + RAG 架構', 'AI Agent 業務流程整合', '技術文件交付'],
  },
  {
    icon: <MessageCircle size={20} />,
    name: '技術諮詢',
    desc: 'AI 架構 + 自動化流程一對一諮詢',
    price: 'NT$3,000',
    unit: '/時',
    color: '#F59E0B',
    features: ['AI 架構規劃建議', 'LLM 技術選型評估', '自動化 Pipeline 設計', '會後整理行動清單'],
  },
  {
    icon: <Globe size={20} />,
    name: '品牌官網全套',
    desc: '官網 + 表單 + AI 通知 + SEO + 部署',
    price: 'NT$30,000',
    unit: '起',
    color: '#4DA3FF',
    features: ['RWD 品牌官網設計', '客戶表單 + AI 即時通知', 'SEO 優化 + 數據追蹤', '網域設定 + 一年維運'],
  },
  {
    icon: <Shield size={20} />,
    name: 'AI 資安防護',
    desc: 'UltraProbe 掃描 + Prompt Injection 防禦',
    price: 'NT$15,000',
    unit: '起',
    color: '#F59E0B',
    features: ['UltraProbe 10 攻擊向量掃描', '多層輸入/輸出防禦建置', 'Prompt Injection + Unicode 防護', '安全報告 + 修復方案'],
  },
  {
    icon: <BookOpen size={20} />,
    name: 'Ultra KB 知識中樞',
    desc: 'Notion 知識庫建置 + 自動化匯入',
    price: 'NT$50,000',
    unit: '起',
    color: '#06B6D4',
    features: ['6-10+ Notion databases 建置', '100-300+ pages 自動匯入（70%）', 'Automation scripts 交付', '30 分鐘 Onboarding Guide'],
    link: '/kb',
  },
]

function PlanCard({ plan }: { plan: ServicePlan }) {
  return (
    <div
      className={`card-lab h-full flex flex-col relative ${plan.popular ? 'ring-1 ring-[rgba(138,92,255,0.3)]' : ''}`}
      style={plan.popular ? { background: 'rgba(18, 12, 40, 0.9)' } : undefined}
    >
      {plan.popular && <div className="badge-popular">最受歡迎</div>}

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${plan.color}15`, color: plan.color }}
        >
          {plan.icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white">{plan.name}</h3>
          <p className="text-xs text-slate-500 truncate">{plan.desc}</p>
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
        href={plan.link || '#contact'}
        {...(plan.link ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onClick={() => trackCTAClick(plan.link ? `前往-${plan.name}` : `聯繫-${plan.name}`)}
        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold rounded-lg transition-all duration-300 hover:-translate-y-0.5"
        style={plan.popular
          ? {
              color: '#fff',
              background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
              boxShadow: '0 0 20px rgba(138, 92, 255, 0.3)',
            }
          : {
              color: plan.color,
              border: `1px solid ${plan.color}40`,
              background: `${plan.color}08`,
            }
        }
        onMouseEnter={(e) => {
          if (!plan.popular) {
            e.currentTarget.style.background = `${plan.color}18`
            e.currentTarget.style.borderColor = plan.color
          }
        }}
        onMouseLeave={(e) => {
          if (!plan.popular) {
            e.currentTarget.style.background = `${plan.color}08`
            e.currentTarget.style.borderColor = `${plan.color}40`
          }
        }}
      >
        {plan.link ? `前往 ${plan.name}` : plan.popular ? '立即開始' : '聯繫我們'}
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
          <span className="terminal-tag mb-4">pricing --transparent</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
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
            AI 自動化工具 — 月訂閱
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
            AI 技術服務 — 專案報價
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
