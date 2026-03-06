import { Shield, Zap, Building2, Check, ArrowRight } from 'lucide-react'

interface PricingPlan {
  icon: typeof Shield
  name: string
  desc: string
  price: string
  period: string
  cryptoPrice?: string
  color: string
  features: string[]
  cta: string
  ctaLink: string
  highlight?: boolean
}

const PLANS: PricingPlan[] = [
  {
    icon: Shield,
    name: 'Free',
    desc: '免費體驗 AI 安全掃描',
    price: '$0',
    period: '',
    color: '#10B981',
    features: [
      '10 次掃描/月',
      '基礎漏洞報告',
      '3 項漏洞詳情',
      'Email gate 解鎖完整報告',
      'Community support',
    ],
    cta: '開始免費掃描',
    ctaLink: '#scan-form',
  },
  {
    icon: Zap,
    name: 'Pro',
    desc: '開發者 & 安全團隊首選',
    price: '$49',
    period: '/mo',
    cryptoPrice: '$44',
    color: '#3B82F6',
    features: [
      '100 次掃描/月',
      'RESTful API access',
      '完整 12 攻擊向量報告',
      '雙語支援 (EN / 繁中)',
      'Email support',
      'Usage dashboard',
    ],
    cta: '取得 API Key',
    ctaLink: '/#contact?plan=pro',
    highlight: true,
  },
  {
    icon: Building2,
    name: 'Enterprise',
    desc: '大規模 AI 安全防護',
    price: '$299',
    period: '/mo',
    cryptoPrice: '$269',
    color: '#8A5CFF',
    features: [
      'Unlimited 掃描',
      '優先 API (低延遲)',
      '客製化攻擊向量',
      '持續安全監控',
      'Dedicated support',
      'SLA 保證 (< 24h)',
    ],
    cta: '聯繫我們',
    ctaLink: '/#contact?plan=enterprise',
  },
]

function PlanCard({ plan }: { plan: PricingPlan }) {
  return (
    <div
      className={`card-probe flex flex-col h-full relative ${
        plan.highlight ? 'ring-1' : ''
      }`}
      style={{
        borderColor: plan.highlight ? `${plan.color}40` : undefined,
        boxShadow: plan.highlight ? `0 0 30px ${plan.color}15` : undefined,
      }}
    >
      {plan.highlight && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full text-white"
          style={{
            background: `linear-gradient(135deg, ${plan.color}, #3B82F6)`,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          RECOMMENDED
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}
        >
          <plan.icon size={18} style={{ color: plan.color }} />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">{plan.name}</h3>
          <p className="text-xs text-slate-500">{plan.desc}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <span
          className="text-4xl font-black text-white"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {plan.price}
        </span>
        {plan.period && (
          <span className="text-sm text-slate-500 ml-1">{plan.period}</span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-slate-400">
            <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={plan.ctaLink}
        className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] ${
          plan.highlight
            ? 'text-white hover:shadow-lg'
            : 'border hover:border-opacity-60'
        }`}
        style={
          plan.highlight
            ? {
                background: `linear-gradient(135deg, #DC2626, ${plan.color})`,
                boxShadow: `0 0 20px ${plan.color}30`,
              }
            : {
                borderColor: `${plan.color}30`,
                background: `${plan.color}08`,
                color: plan.color,
              }
        }
      >
        {plan.cta}
        <ArrowRight size={16} />
      </a>

      {/* Crypto CTA */}
      {plan.cryptoPrice && (
        <a
          href={`${plan.ctaLink}&payment=crypto`}
          className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-medium border transition-all duration-300 hover:scale-[1.02] mt-2"
          style={{
            borderColor: 'rgba(245,158,11,0.3)',
            background: 'rgba(245,158,11,0.05)',
            color: '#F59E0B',
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ₿ 加密貨幣付款 {plan.cryptoPrice} USD
          </span>
          <span className="text-[10px] opacity-60">(9折)</span>
        </a>
      )}
    </div>
  )
}

export default function ApiPricingSection() {
  return (
    <section id="pricing" className="relative py-20 px-4 sm:px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(255,58,58,0.1) 50%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="terminal-tag-probe mx-auto mb-6 w-fit">
            ultraprobe --pricing
          </div>

          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            選擇你的
            <span className="text-gradient-probe"> 安全等級</span>
          </h2>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            從免費掃描到企業級防護，保護你的 AI 系統免受 Prompt Injection 攻擊
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-sm text-slate-500">
            所有方案覆蓋 OWASP LLM Top 10 攻擊向量
          </p>
          <p className="text-xs text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            支援 BTC, ETH, USDT, SOL 等 100+ 種加密貨幣 via NOWPayments
          </p>
        </div>
      </div>
    </section>
  )
}
