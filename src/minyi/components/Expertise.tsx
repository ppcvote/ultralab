import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { useInView } from '../../hooks/useInView'

const STATS = [
  { value: 10, display: '10', unit: '年+', label: '從業經驗' },
  { value: 3000, display: '3,000', unit: '+', label: '服務客戶' },
  { value: 600, display: '600', unit: '+', label: '家庭規劃' },
  { value: 17, display: '17', unit: '億+', label: '規劃資產' },
]

function useCountUp(target: number, shouldStart: boolean, duration = 1500) {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  const easeOut = useCallback((t: number) => 1 - Math.pow(1 - t, 3), [])

  useEffect(() => {
    if (!shouldStart) return
    startTimeRef.current = 0

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOut(progress)
      setCurrent(Math.round(easedProgress * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [shouldStart, target, duration, easeOut])

  return current
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

function AnimatedStat({ stat, isInView, delay }: {
  stat: typeof STATS[number]
  isInView: boolean
  delay: number
}) {
  const count = useCountUp(stat.value, isInView)

  const base = 'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]'
  const hidden = 'opacity-0 translate-y-6'
  const visible = 'opacity-100 translate-y-0'

  return (
    <div
      className={`text-center py-3 rounded-2xl bg-white border border-slate-100 ${base} ${isInView ? visible : hidden}`}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <p className="text-xl md:text-2xl font-bold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {formatNumber(count)}
        <span className="text-sm text-blue-600">{stat.unit}</span>
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">{stat.label}</p>
    </div>
  )
}

const CERTS = [
  {
    abbr: 'MDRT',
    full: '美國百萬圓桌會員',
    desc: '全球壽險業最高榮譽，僅前 1% 業務員達標，須每年重新取得資格。',
    badge: 'Top 1%',
    highlight: true,
  },
  {
    abbr: 'ChRP',
    full: '認證退休規劃顧問師',
    desc: 'IARFC 頒授的退休規劃專業認證。須通過退休需求分析、資產提領策略、遺產規劃等專科考核，台灣持證人數極少。',
    badge: null,
    highlight: false,
  },
  {
    abbr: 'IARFC',
    full: '國際認證財務顧問師',
    desc: '美國 IARFC 協會認證，須完成 60 小時課程並通過投資、稅務、風管、經濟、綜合規劃五科考試，全球僅約 8,000 位持證人。',
    badge: null,
    highlight: false,
  },
  {
    abbr: 'AIAM',
    full: '專業壽險經理人',
    desc: 'LIMRA 頒授，須完成 4 門管理專科課程並繳交實務論文，專為壽險通路經營管理者設計的國際認證。',
    badge: null,
    highlight: false,
  },
]

export default function Expertise() {
  const { ref, isInView } = useInView({ threshold: 0.15 })
  const [expanded, setExpanded] = useState<string | null>(null)

  const base = 'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]'
  const hidden = 'opacity-0 translate-y-6'
  const visible = 'opacity-100 translate-y-0'

  return (
    <section ref={ref} className="px-6 pb-10">
      {/* Section label */}
      <p
        className={`text-[10px] uppercase tracking-widest text-slate-400 mb-6 text-center ${base} ${isInView ? visible : hidden}`}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        About
      </p>

      {/* Philosophy quote */}
      <div
        className={`max-w-md mx-auto text-center mb-8 ${base} ${isInView ? visible : hidden}`}
        style={{ transitionDelay: '80ms' }}
      >
        <blockquote className="text-lg md:text-xl font-semibold text-slate-800 leading-relaxed mb-3">
          「每一分錢都有它該去的位置。<br />
          我幫你找到那個位置。」
        </blockquote>
        <p className="text-xs text-slate-400 leading-relaxed">
          單純喜歡看到一個人，能因為自己開始成長。
        </p>
      </div>

      {/* Stats strip — 2x2 mobile, 4-col md+ */}
      <div
        className={`grid grid-cols-2 md:grid-cols-4 gap-2 max-w-md mx-auto mb-8 ${base} ${isInView ? visible : hidden}`}
        style={{ transitionDelay: '160ms' }}
      >
        {STATS.map((stat, i) => (
          <AnimatedStat
            key={stat.label}
            stat={stat}
            isInView={isInView}
            delay={200 + i * 60}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-8 h-px mx-auto mb-8 bg-slate-200" />

      {/* Certifications — expandable with descriptions */}
      <div
        className={`max-w-sm mx-auto ${base} ${isInView ? visible : hidden}`}
        style={{ transitionDelay: '400ms' }}
      >
        <div className="space-y-2">
          {CERTS.map((cert, i) => {
            const isOpen = expanded === cert.abbr
            return (
              <button
                key={cert.abbr}
                onClick={() => setExpanded(isOpen ? null : cert.abbr)}
                className={`w-full text-left px-3.5 py-3 rounded-xl bg-white border transition-all duration-200 hover:shadow-sm ${
                  cert.highlight
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-100 hover:border-blue-200'
                } ${base} ${isInView ? visible : hidden}`}
                style={{ transitionDelay: `${440 + i * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        cert.highlight
                          ? 'text-amber-700 bg-amber-50'
                          : 'text-blue-600 bg-blue-50'
                      }`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {cert.abbr}
                    </span>
                    <span className="text-[12px] text-slate-600 font-medium">{cert.full}</span>
                    {cert.badge && (
                      <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">
                        {cert.badge}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-20 mt-2' : 'max-h-0'}`}
                >
                  <p className="text-[11px] text-slate-400 leading-relaxed pl-[calc(1.5rem+10px)]">
                    {cert.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
