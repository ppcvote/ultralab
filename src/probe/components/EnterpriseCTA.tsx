import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

const ENTERPRISE_FEATURES = [
  'AI 系統滲透測試',
  'Prompt Injection 防禦建置',
  '安全稽核報告',
  '客製化攻擊向量檢測',
  '持續安全監控',
  '團隊安全培訓',
]

export default function EnterpriseCTA() {
  return (
    <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(138,92,255,0.1) 0%, rgba(59,130,246,0.1) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-probe-grid opacity-30" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        <div className="card-probe p-8 sm:p-12"
          style={{
            background: 'linear-gradient(135deg, rgba(12,12,24,0.95) 0%, rgba(20,20,40,0.95) 100%)',
            borderColor: 'rgba(138,92,255,0.3)',
          }}
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6"
                style={{
                  borderColor: 'rgba(138,92,255,0.4)',
                  background: 'rgba(138,92,255,0.1)',
                }}
              >
                <Sparkles size={14} style={{ color: '#8A5CFF' }} />
                <span className="text-xs font-bold" style={{ color: '#8A5CFF' }}>
                  企業級服務
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                需要更強大的
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                  AI 安全解決方案？
                </span>
              </h2>

              <p className="text-lg text-slate-300 mb-8">
                Ultra Lab 提供完整的 AI 安全服務，
                從滲透測試到防禦建置，保護您的 LLM 應用免受攻擊。
              </p>

              {/* Features Grid */}
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {ENTERPRISE_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={18} style={{ color: '#10B981' }} className="flex-shrink-0" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <a
                  href="/#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #8A5CFF, #3B82F6)',
                    boxShadow: '0 0 20px rgba(138,92,255,0.3)',
                  }}
                >
                  聯繫 Ultra Lab
                  <ArrowRight size={18} />
                </a>

                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border transition-all duration-300 hover:scale-105"
                  style={{
                    borderColor: 'rgba(138,92,255,0.3)',
                    background: 'rgba(138,92,255,0.05)',
                    color: '#8A5CFF',
                  }}
                >
                  查看更多服務
                </a>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Decorative elements */}
                <div
                  className="absolute inset-0 rounded-2xl blur-2xl opacity-30"
                  style={{
                    background: 'linear-gradient(135deg, #8A5CFF 0%, #3B82F6 100%)',
                  }}
                />

                <div className="relative card-probe p-6"
                  style={{
                    background: 'rgba(12,12,24,0.8)',
                    borderColor: 'rgba(138,92,255,0.3)',
                  }}
                >
                  <div className="text-center mb-6">
                    <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      A+
                    </div>
                    <div className="text-sm text-slate-400">
                      企業級安全等級
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: '漏洞偵測', value: '100%' },
                      { label: '防禦覆蓋率', value: '99.8%' },
                      { label: '回應時間', value: '< 24h' },
                    ].map((stat, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{stat.label}</span>
                        <span className="font-bold text-white">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
