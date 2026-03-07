import { useState, useEffect } from 'react'
import { Shield, Globe, Zap, Languages } from 'lucide-react'

const CAPABILITIES = [
  {
    icon: Shield,
    value: '12',
    label: '攻擊向量',
    description: '涵蓋 OWASP LLM Top 10',
    color: '#FF3A3A',
  },
  {
    icon: Globe,
    value: '20+',
    label: '平台偵測',
    description: 'Chatbot 與 AI Widget 辨識',
    color: '#3B82F6',
  },
  {
    icon: Zap,
    value: '< 5s',
    label: '掃描速度',
    description: '確定性規則 + AI 深度分析',
    color: '#F59E0B',
  },
  {
    icon: Languages,
    value: '2',
    label: '語言支援',
    description: 'English / 繁體中文',
    color: '#10B981',
  },
]

export default function LiveStatsSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
            style={{
              borderColor: 'rgba(59,130,246,0.3)',
              background: 'rgba(59,130,246,0.05)',
            }}
          >
            <Shield size={16} style={{ color: '#3B82F6' }} />
            <span className="text-sm font-medium" style={{ color: '#3B82F6' }}>
              掃描能力
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            一次掃描，
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {' '}全面防護
            </span>
          </h2>

          <p className="text-lg text-slate-400">
            確定性規則引擎 + AI 深度分析，可重現的安全評估
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAPABILITIES.map((cap, i) => (
            <div
              key={i}
              className={`card-probe text-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: `${i * 100}ms`,
                borderColor: `${cap.color}20`,
                background: 'rgba(12,12,24,0.6)',
              }}
            >
              <div className="flex justify-center mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${cap.color}15`,
                    border: `1px solid ${cap.color}30`,
                  }}
                >
                  <cap.icon size={24} style={{ color: cap.color }} />
                </div>
              </div>

              <div className="mb-2">
                <span
                  className="text-4xl font-black"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: cap.color,
                  }}
                >
                  {cap.value}
                </span>
              </div>

              <div className="text-sm font-medium text-white mb-2">
                {cap.label}
              </div>

              <div className="text-xs text-slate-500">
                {cap.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
