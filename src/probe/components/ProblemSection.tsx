import { AlertTriangle, Lock, Database, Shield } from 'lucide-react'

const RISKS = [
  {
    icon: Lock,
    title: '角色逃逸',
    description: '攻擊者重新定義 AI 角色，繞過所有安全規則',
    color: '#FF3A3A',
  },
  {
    icon: Database,
    title: '資料洩漏',
    description: '誘騙 AI 洩漏 System Prompt、訓練資料或敏感資訊',
    color: '#F97316',
  },
  {
    icon: AlertTriangle,
    title: '輸出武器化',
    description: '操控 AI 生成釣魚郵件、惡意程式碼等危險內容',
    color: '#F59E0B',
  },
  {
    icon: Shield,
    title: '指令覆寫',
    description: '注入新指令覆蓋原有規則，完全控制 AI 行為',
    color: '#EF4444',
  },
]

export default function ProblemSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,58,58,0.15) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
            style={{
              borderColor: 'rgba(255,58,58,0.3)',
              background: 'rgba(255,58,58,0.05)',
            }}
          >
            <AlertTriangle size={16} style={{ color: '#FF3A3A' }} />
            <span className="text-sm font-medium" style={{ color: '#FF3A3A' }}>
              全球 AI 系統面臨的安全危機
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6">
            <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
              90% 的 AI 系統
            </span>
            <br />
            存在 Prompt Injection 漏洞
          </h2>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            根據 OWASP 2023 報告，Prompt Injection 是 LLM 應用的頭號安全威脅。
            <br />
            一個簡單的攻擊指令，就能讓你的 AI 系統徹底失控。
          </p>
        </div>

        {/* Risk Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {RISKS.map((risk, i) => (
            <div
              key={i}
              className="card-probe group hover:scale-105 transition-all duration-300"
              style={{
                borderColor: `${risk.color}30`,
                background: 'rgba(12,12,24,0.6)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{
                  background: `${risk.color}15`,
                  border: `1px solid ${risk.color}30`,
                }}
              >
                <risk.icon size={24} style={{ color: risk.color }} />
              </div>

              <h3
                className="text-lg font-bold mb-2"
                style={{ color: risk.color }}
              >
                {risk.title}
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed">
                {risk.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-300 text-lg mb-4">
            <strong className="text-white">你的 AI 系統安全嗎？</strong>
            <br className="sm:hidden" />
            <span className="text-slate-400"> 立即免費掃描，找出隱藏的漏洞。</span>
          </p>
        </div>
      </div>
    </section>
  )
}
