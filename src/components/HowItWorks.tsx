import { MessageSquareText, Settings2, Rocket, ArrowRight } from 'lucide-react'
import { useInView } from '../hooks/useInView'

interface Phase {
  icon: React.ReactNode
  color: string
  glowColor: string
  phase: string
  title: string
  subtitle: string
  description: string
  detail: string
}

const phases: Phase[] = [
  {
    icon: <MessageSquareText size={32} />,
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    phase: 'Step 1',
    title: 'AI 架構審計',
    subtitle: '不是問你要什麼，是看你缺什麼',
    description: '分析你現有的技術棧、數據流和業務邏輯。找出 AI 自動化切入點、評估 LLM 模型選型（Gemini / Claude / GPT），設計 Prompt 架構和容錯策略。',
    detail: '免費 · LLM 選型 · Prompt 工程評估 · 24hr 回覆',
  },
  {
    icon: <Settings2 size={32} />,
    color: '#4DA3FF',
    glowColor: 'rgba(77, 163, 255, 0.3)',
    phase: 'Step 2',
    title: 'Pipeline 建置',
    subtitle: '不是接一個 API，是建一條產線',
    description: '串接 Multi-LLM API、建立輸入驗證層 + Zod 結構化輸出解析、部署 Vercel Edge Functions。用跟我們自己 6 個產品相同的架構。',
    detail: 'Multi-LLM 路由 · Zod 驗證 · Edge 部署 · 即時監控',
  },
  {
    icon: <Rocket size={32} />,
    color: '#8A5CFF',
    glowColor: 'rgba(138, 92, 255, 0.3)',
    phase: 'Step 3',
    title: '自動運營 + 防禦',
    subtitle: '上線不是結束，是開始',
    description: '系統上線即全自動 — Cron 排程驅動、異常自動重試、UltraProbe 安全掃描。我們自己的系統每天自動產出 35+ 篇內容，同一套架構交付給你。',
    detail: '35+篇/天驗證 · UltraProbe 安全 · 自動重試 · 持續優化',
  },
]

export default function HowItWorks() {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 overflow-hidden bg-lab" ref={ref} aria-label="三步驟啟動 AI 自動化">
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #0A0515 0%, #0D0820 50%, #0A0515 100%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="terminal-tag mb-4">cat ai-pipeline.md</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            三步驟，<span className="text-gradient-purple">啟動 AI 自動化</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            從需求分析到 AI 系統上線，快速部署你的自動化引擎
          </p>
        </div>

        {/* Phases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connecting line (desktop) */}
          <div
            className="hidden md:block absolute top-1/2 left-[17%] right-[17%] h-px z-0"
            style={{
              background: 'linear-gradient(90deg, #F59E0B40, #4DA3FF40, #8A5CFF40)',
              transform: 'translateY(-50%)',
            }}
          />

          {phases.map((phase, index) => (
            <div
              key={phase.phase}
              className={`relative z-10 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${(index + 1) * 0.15}s` }}
            >
              <div className="card-lab flex flex-col items-center h-full p-8">
                {/* Phase Label */}
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{
                    color: phase.color,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {phase.phase}
                </span>

                {/* Icon */}
                <div
                  className="mt-4 mb-4 shrink-0"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${phase.color}12`,
                    color: phase.color,
                    boxShadow: `0 0 20px ${phase.glowColor}`,
                  }}
                >
                  {phase.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-1 text-center">{phase.title}</h3>
                <p
                  className="text-base font-semibold mb-3 text-center"
                  style={{ color: phase.color }}
                >
                  「{phase.subtitle}」
                </p>

                {/* Description */}
                <p className="text-sm text-slate-400 mb-2 text-center">{phase.description}</p>
                <p
                  className="text-xs text-slate-500 text-center"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {phase.detail}
                </p>
              </div>

              {/* Arrow between phases (mobile) */}
              {index < phases.length - 1 && (
                <div className="flex justify-center my-4 md:hidden text-slate-600">
                  <ArrowRight size={24} className="rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
