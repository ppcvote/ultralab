import { ArrowRight, Users, FileCheck, Clock } from 'lucide-react'

const DIFFERENTIATORS = [
  { icon: Users, label: '專屬安全團隊' },
  { icon: FileCheck, label: '合規報告 (SOC 2 / ISO 27001)' },
  { icon: Clock, label: 'SLA 保證 < 24h 回應' },
]

export default function EnterpriseCTA() {
  return (
    <section className="relative py-16 px-4 sm:px-6">
      <div className="relative max-w-5xl mx-auto">
        <div
          className="card-probe px-8 py-8 sm:px-12 sm:py-10"
          style={{
            background: 'linear-gradient(135deg, rgba(12,12,24,0.95) 0%, rgba(20,20,40,0.95) 100%)',
            borderColor: 'rgba(138,92,255,0.25)',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Text */}
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-2">
                需要客製化
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {' '}AI 安全方案？
                </span>
              </h3>
              <p className="text-sm text-slate-400 mb-4 lg:mb-0">
                從滲透測試到防禦建置，Ultra Lab 專業團隊為您的 LLM 系統提供完整保護。
              </p>

              {/* Differentiators — mobile */}
              <div className="flex flex-wrap gap-3 lg:hidden">
                {DIFFERENTIATORS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Icon size={14} style={{ color: '#8A5CFF' }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Differentiators — desktop */}
            <div className="hidden lg:flex items-center gap-5 flex-shrink-0">
              {DIFFERENTIATORS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                  <Icon size={14} style={{ color: '#8A5CFF' }} />
                  {label}
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="/#contact?service=security-audit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:scale-105 hover:shadow-lg flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #8A5CFF, #3B82F6)',
                boxShadow: '0 0 20px rgba(138,92,255,0.25)',
              }}
            >
              預約免費評估
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
