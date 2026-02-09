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
    title: '免費諮詢',
    subtitle: '聊一聊你的需求',
    description: '填寫表單或直接私訊，我們會在 24 小時內回覆',
    detail: '零壓力 · 免費 · 快速回應',
  },
  {
    icon: <Settings2 size={32} />,
    color: '#4DA3FF',
    glowColor: 'rgba(77, 163, 255, 0.3)',
    phase: 'Step 2',
    title: '量身打造',
    subtitle: '選方案或客製化',
    description: '訂閱自動化工具，或由我們為你客製開發',
    detail: '彈性方案 · 透明報價',
  },
  {
    icon: <Rocket size={32} />,
    color: '#8A5CFF',
    glowColor: 'rgba(138, 92, 255, 0.3)',
    phase: 'Step 3',
    title: '上線運營',
    subtitle: '你專注業務，系統幫你跑',
    description: '自動化系統 24/7 運作，持續優化、定期回報',
    detail: '全自動 · 持續迭代',
  },
]

export default function HowItWorks() {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden" ref={ref}>
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
          <span
            className="inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase rounded-full border border-[rgba(138,92,255,0.3)] text-[#CE4DFF] mb-4"
            style={{
              background: 'rgba(138, 92, 255, 0.08)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            三步驟，<span className="text-gradient-purple">開始自動化</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            從諮詢到上線，快速又簡單
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
              <div
                className="flex flex-col items-center h-full overflow-hidden"
                style={{
                  background: 'rgba(15, 10, 30, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(138, 92, 255, 0.15)',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
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
