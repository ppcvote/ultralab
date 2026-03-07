import { Award, CheckCircle2, Zap, Users } from 'lucide-react'

const EXPERTISE = [
  {
    icon: Award,
    metric: '10+',
    label: 'AI 專案經驗',
    description: '從 ChatGPT 到企業級 LLM 應用',
    color: '#3B82F6',
  },
  {
    icon: CheckCircle2,
    metric: '12',
    label: '攻擊向量',
    description: 'OWASP LLM Top 10 完整覆蓋',
    color: '#10B981',
  },
  {
    icon: Zap,
    metric: '< 5s',
    label: '掃描速度',
    description: '確定性規則 + Gemini 2.5 Flash',
    color: '#F59E0B',
  },
  {
    icon: Users,
    metric: '100%',
    label: '免費開放',
    description: '支持全球開發者社群',
    color: '#8A5CFF',
  },
]

export default function ExpertiseSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
            style={{
              borderColor: 'rgba(138,92,255,0.3)',
              background: 'rgba(138,92,255,0.05)',
            }}
          >
            <Award size={16} style={{ color: '#8A5CFF' }} />
            <span className="text-sm font-medium" style={{ color: '#8A5CFF' }}>
              Ultra Lab 打造
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black mb-6">
            專注
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              {' '}AI Prompt 安全
            </span>
          </h2>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            幫助開發者保護 AI 系統，
            <br />
            從 Prompt 健檢到持續安全監控。
          </p>
        </div>

        {/* Expertise Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {EXPERTISE.map((item, i) => (
            <div
              key={i}
              className="card-probe text-center group hover:scale-105 transition-all duration-300"
              style={{
                borderColor: `${item.color}20`,
                background: 'rgba(12,12,24,0.4)',
              }}
            >
              <div className="flex justify-center mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{
                    background: `${item.color}15`,
                    border: `2px solid ${item.color}30`,
                  }}
                >
                  <item.icon size={28} style={{ color: item.color }} />
                </div>
              </div>

              <div
                className="text-4xl font-black mb-2"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: item.color,
                }}
              >
                {item.metric}
              </div>

              <div className="text-white font-bold mb-2">
                {item.label}
              </div>

              <p className="text-sm text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Features List */}
        <div className="card-probe" style={{ background: 'rgba(59,130,246,0.03)' }}>
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            UltraProbe 核心能力
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              '角色逃逸偵測',
              '指令覆寫分析',
              '輸出格式操控',
              '資料洩漏風險',
              '多語言繞過',
              'Unicode 攻擊',
              '上下文溢位',
              '間接注入檢測',
              '社交工程防禦',
              '輸出武器化偵測',
              '濫用防護檢查',
              '輸入驗證分析',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 size={18} style={{ color: '#10B981' }} className="flex-shrink-0" />
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
