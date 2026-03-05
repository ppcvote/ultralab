import { useInView } from '../hooks/useInView'
import { useCountUp } from '../hooks/useCountUp'
import { useLiveStats } from '../hooks/useLiveStats'

const credentials = [
  'Full-Stack SaaS 創業者',
  'Gemini / Claude Multi-LLM 架構師',
  'AI 社群自動化系統設計者',
  '資安滲透測試工具開發者',
]

const links = [
  {
    label: 'Threads',
    href: 'https://www.threads.net/@minyi.chen',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.22 1.332-2.96.834-.668 1.98-1.05 3.234-1.143.755-.056 1.527-.036 2.299-.017l.135.003c.353.009.705.017 1.056.017-.003-.157-.01-.312-.023-.466-.169-2.073-1.11-3.134-2.797-3.153-1.15.01-2.074.512-2.745 1.49l-1.71-1.09c.982-1.428 2.417-2.183 4.27-2.248l.087-.002c2.665 0 4.397 1.56 4.666 4.19.043.414.063.84.063 1.272 0 .103-.001.206-.004.31 1.067.594 1.9 1.424 2.428 2.454.855 1.666.96 4.453-1.165 6.542-1.796 1.763-4.027 2.548-7.234 2.573zM13.6 14.002c-.493 0-.987.012-1.478.036-.907.067-1.61.313-2.087.73-.396.346-.584.763-.558 1.236.04.735.387 1.262 1.032 1.567.585.277 1.332.377 2.1.338 1.07-.058 1.895-.44 2.449-1.13.38-.474.66-1.107.834-1.89a17.093 17.093 0 00-2.292-.887z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/ultralab.tw',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:contact@ultralab.tw',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
]

function AnimatedStat({ value, suffix, label, animate }: { value: number; suffix: string; label: string; animate: boolean }) {
  const count = useCountUp(value, value > 100 ? 2500 : 1500, animate)
  return (
    <div className="text-center">
      <div
        className="text-2xl sm:text-3xl font-bold text-gradient-purple"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

export default function Founder() {
  const { ref, isInView } = useInView({ threshold: 0.15 })
  const liveStats = useLiveStats()

  const stats = [
    { value: 6, suffix: '', label: 'AI 產品上線' },
    { value: liveStats.totalPosts, suffix: '+', label: 'AI 自動發文' },
    { value: liveStats.totalFollowers, suffix: '+', label: 'AI 驅動粉絲' },
    { value: 10, suffix: '', label: '攻擊向量覆蓋' },
  ]

  return (
    <section ref={ref} id="founder" className="relative py-24 lg:py-32 overflow-hidden" aria-label="創辦人">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(138,92,255,0.1) 0%, transparent 60%)' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="terminal-tag mb-4">whoami</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            一個人的<span className="text-gradient-purple">技術軍團</span>
          </h2>
        </div>

        <div className={`card-lab p-8 sm:p-10 ${isInView ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
            {/* Avatar */}
            <div className="shrink-0">
              <div
                className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(138,92,255,0.2), rgba(206,77,255,0.15))',
                  border: '2px solid rgba(138,92,255,0.3)',
                  boxShadow: '0 0 40px rgba(138,92,255,0.15)',
                }}
              >
                <span
                  className="text-4xl lg:text-5xl font-[800] text-gradient-purple"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  MY
                </span>
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-2xl" style={{ border: '2px solid rgba(138,92,255,0.2)', animation: 'pulseRing 3s ease-out infinite' }} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl font-[800] text-white mb-1">
                Min Yi Chen
              </h3>
              <p className="text-lg text-slate-400 mb-1">陳旻毅</p>
              <p
                className="text-sm mb-5"
                style={{ color: '#CE4DFF', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Founder & CTO — Ultra Creation Co., Ltd.
              </p>

              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xl">
                一個人打造整個 AI 自動化技術棧 — 從 LLM 串接、社群自動化引擎、知識中樞建置到資安掃描工具。
                不是管理者，是每一行程式碼的作者。6 個 AI 產品，35+ 篇每日自動產出，全部獨立完成。
              </p>

              {/* Credentials */}
              <div className="flex flex-wrap gap-2 mb-6 justify-center lg:justify-start">
                {credentials.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 text-[11px] rounded-md border"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'rgba(206,77,255,0.8)',
                      background: 'rgba(206,77,255,0.06)',
                      borderColor: 'rgba(206,77,255,0.15)',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* Build Log */}
              <div className="mb-6">
                <p
                  className="text-[10px] uppercase tracking-widest text-slate-600 mb-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Build Log
                </p>
                <div className="relative pl-4 border-l border-[rgba(138,92,255,0.2)] space-y-2.5">
                  {[
                    { date: '2025.09', event: 'Ultra Creation Co., Ltd. 成立' },
                    { date: '2025.11', event: 'Mind Threads SaaS 上線 — 台灣零競品' },
                    { date: '2026.01', event: 'risk.clock.tw 24hr 破 1,300 追蹤' },
                    { date: '2026.02', event: 'UltraProbe AI 安全掃描器上線' },
                    { date: '2026.03', event: '13 篇技術文章 · 35,000+ AI 自動發文' },
                  ].map((item) => (
                    <div key={item.date} className="relative flex items-baseline gap-3">
                      <div
                        className="absolute -left-[19px] top-[6px] w-2 h-2 rounded-full"
                        style={{ background: '#8A5CFF', boxShadow: '0 0 6px rgba(138,92,255,0.4)' }}
                      />
                      <span
                        className="text-[11px] text-slate-600 shrink-0"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {item.date}
                      </span>
                      <span className="text-[12px] text-slate-400">{item.event}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#CE4DFF] hover:bg-[rgba(138,92,255,0.08)] transition-all"
                    aria-label={link.label}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 pt-8 border-t border-[rgba(138,92,255,0.1)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((s) => (
                <AnimatedStat key={s.label} {...s} animate={isInView} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
