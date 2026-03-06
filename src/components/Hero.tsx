import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { trackCTAClick } from '../lib/analytics'
import { useInView } from '../hooks/useInView'
import { useCountUp } from '../hooks/useCountUp'
import { useLiveStats } from '../hooks/useLiveStats'

interface StatConfig {
  end: number
  suffix: string
  label: string
}

const techStack = [
  'Gemini API', 'Claude API', 'React', 'TypeScript', 'Firebase',
  'FFmpeg GPU', 'Playwright', 'Python', 'Node.js', 'Vercel Edge',
  'Meta Threads API', 'Prompt Engineering', 'RAG', 'AI Agent',
]

const words = ['Build.', 'Ship.', 'Scale.']

/* ── Typing effect ── */
function useTypingEffect() {
  const full = words.join(' ')
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(full)
      setDone(true)
      return
    }
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(full.slice(0, i))
      if (i >= full.length) { clearInterval(timer); setDone(true) }
    }, 60)
    return () => clearInterval(timer)
  }, [full])

  return { displayed, done }
}

/* ── Animated Terminal ── */
interface TLine {
  type: 'cmd' | 'ok' | 'divider' | 'status' | 'summary'
  text?: string
  meta?: string
  time?: string
}

const TERM_LINES: TLine[] = [
  { type: 'cmd', text: 'ultra-lab deploy --production' },
  { type: 'ok', text: 'Gemini 2.5 Flash API', meta: 'connected', time: '120ms' },
  { type: 'ok', text: 'AI content pipeline', meta: 'auto-generating', time: '847ms' },
  { type: 'ok', text: 'Threads API multi-account', meta: 'auto-publishing', time: '1.2s' },
  { type: 'ok', text: 'FFmpeg GPU encoder', meta: 'IG Reels ready', time: '634ms' },
  { type: 'ok', text: 'UltraProbe security scan', meta: '10/10 passed', time: '412ms' },
  { type: 'divider' },
  { type: 'status', text: 'ALL SYSTEMS OPERATIONAL' },
  { type: 'summary', text: '' }, // dynamic — filled by LiveTerminal
]

function LiveTerminal({ stats }: { stats: { totalPosts: number; totalFollowers: number } }) {
  const { ref, isInView } = useInView({ threshold: 0.3 })
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const delays = [0, 500, 1000, 1500, 2000, 2500, 3100, 3400, 3700]
    const timers = delays.map((d, i) => setTimeout(() => setVisible(i + 1), d))
    return () => timers.forEach(clearTimeout)
  }, [isInView])

  return (
    <div
      ref={ref}
      className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8, 5, 18, 0.9)',
        border: '1px solid rgba(138, 92, 255, 0.15)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(138,92,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
        <span className="ml-2 text-[11px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ultra-lab — ai-engine v2.4
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-500/70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>live</span>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-4 sm:p-5 space-y-1.5 min-h-[220px] text-[11px] sm:text-[13px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {TERM_LINES.slice(0, visible).map((line, i) => {
          if (line.type === 'cmd') return (
            <div key={i} className="flex items-center gap-2 text-slate-300">
              <span className="text-green-400">$</span>
              <span>{line.text}</span>
              <span className="animate-pulse text-purple-400">_</span>
            </div>
          )
          if (line.type === 'ok') return (
            <div key={i} className="flex items-center justify-between text-slate-400 animate-fade-in">
              <span className="truncate">
                <span className="text-green-400 mr-2">✓</span>
                {line.text}
                <span className="text-slate-600 ml-2 hidden sm:inline">← {line.meta}</span>
              </span>
              <span className="text-slate-700 text-xs hidden sm:block shrink-0 ml-2">{line.time}</span>
            </div>
          )
          if (line.type === 'divider') return (
            <div key={i} className="py-1">
              <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(138,92,255,0.3), rgba(206,77,255,0.5), rgba(138,92,255,0.3))' }} />
            </div>
          )
          if (line.type === 'status') return (
            <div key={i} className="flex items-center gap-2 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-bold tracking-wide text-xs">{line.text}</span>
            </div>
          )
          if (line.type === 'summary') return (
            <div key={i} className="text-slate-500 text-xs animate-fade-in">
              {stats.totalPosts.toLocaleString()}+ posts published · {stats.totalFollowers.toLocaleString()}+ followers · zero humans
            </div>
          )
          return null
        })}
      </div>
    </div>
  )
}

/* ── Counter Stat ── */
function AnimatedStat({ config, animate }: { config: StatConfig; animate: boolean }) {
  const count = useCountUp(config.end, config.end > 100 ? 2500 : 1800, animate)
  return (
    <div className="stat-card group">
      <div className="text-3xl sm:text-4xl font-bold text-gradient-purple" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {count.toLocaleString()}{config.suffix}
      </div>
      <div className="mt-2 text-sm text-slate-500 group-hover:text-slate-400 transition-colors">{config.label}</div>
    </div>
  )
}

/* ── Marquee ── */
function TechMarquee() {
  const items = [...techStack, ...techStack]
  return (
    <div className="relative overflow-hidden h-8">
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-[#0A0515] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[#0A0515] to-transparent pointer-events-none" />
      <div className="marquee-track">
        {items.map((tech, i) => (
          <span
            key={`${tech}-${i}`}
            className="mx-2 px-4 py-1.5 text-xs text-slate-400 rounded-lg border border-[rgba(138,92,255,0.1)] whitespace-nowrap hover:border-[rgba(138,92,255,0.3)] hover:text-slate-300 transition-all"
            style={{ background: 'rgba(138, 92, 255, 0.04)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Hero ── */
export default function Hero() {
  const { displayed, done } = useTypingEffect()
  const { ref: statsRef, isInView: statsVisible } = useInView({ threshold: 0.3 })
  const liveStats = useLiveStats()

  const statConfigs: StatConfig[] = [
    { end: liveStats.totalPosts, suffix: '+', label: 'AI 自動發文' },
    { end: liveStats.totalFollowers, suffix: '+', label: 'AI 驅動粉絲' },
    { end: 3, suffix: '', label: 'SaaS 產品上線' },
    { end: 100, suffix: '%', label: '端到端自動化' },
  ]

  return (
    <section className="relative overflow-hidden bg-lab min-h-[100svh] flex flex-col w-full max-w-full">
      {/* Ambient glow orbs — isolated in overflow-hidden wrapper to prevent mobile bleed */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(138,92,255,0.3) 0%, transparent 60%)', filter: 'blur(120px)', animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(206,77,255,0.25) 0%, transparent 60%)', filter: 'blur(120px)', animation: 'float 10s ease-in-out infinite reverse' }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(77,163,255,0.1) 0%, transparent 65%)', filter: 'blur(100px)', animation: 'float 12s ease-in-out infinite' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, #0A0515 75%)' }} />
      </div>

      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 pb-12 lg:pt-36 lg:pb-16 flex-1 flex flex-col justify-center min-w-0 overflow-hidden">
        {/* Terminal tag */}
        <div className="animate-fade-in-up">
          <span className="terminal-tag">ultra-lab init — AI-Powered Automation Infrastructure</span>
        </div>

        {/* Title */}
        <h1 className="mt-8 font-[800] leading-[0.95] tracking-tight animate-fade-in-up delay-100" style={{ fontSize: 'clamp(2rem, 8vw, 8rem)', fontFamily: "'Outfit', system-ui, sans-serif", maxWidth: '100%', overflowWrap: 'break-word' }}>
          <span className="text-gradient-hero">{displayed}</span>
          {!done && <span className="inline-block w-[3px] sm:w-[4px] lg:w-[6px] ml-1 align-middle rounded-full" style={{ height: '0.8em', background: 'linear-gradient(180deg, #8A5CFF, #CE4DFF)', animation: 'typing-cursor 0.8s step-end infinite' }} />}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 sm:mt-8 text-lg sm:text-2xl lg:text-3xl text-slate-200 font-light animate-fade-in-up delay-200">
          AI 驅動的自動化引擎 — 已自動產出 {liveStats.totalPosts.toLocaleString()}+ 篇內容，完全零人工。
        </p>

        {/* CTA */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up delay-300">
          <a
            href="#contact"
            className="group inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 text-base font-semibold text-white rounded-xl transition-all duration-300 hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)', boxShadow: '0 0 30px rgba(138,92,255,0.4), 0 0 60px rgba(138,92,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(138,92,255,0.6), 0 0 100px rgba(138,92,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 30px rgba(138,92,255,0.4), 0 0 60px rgba(138,92,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)' }}
            onClick={() => trackCTAClick('免費諮詢')}
          >
            免費諮詢
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="/agent"
            onClick={() => trackCTAClick('看 AI Agents')}
            className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 text-base font-semibold text-white rounded-xl border border-[rgba(255,107,53,0.4)] hover:border-[rgba(255,107,53,0.7)] transition-all duration-300 hover:-translate-y-1"
            style={{ background: 'rgba(255,107,53,0.1)', backdropFilter: 'blur(8px)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 30px rgba(255,107,53,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
          >
            <span>⚡</span> 看 AI Agents
            <ArrowRight size={18} />
          </a>
        </div>

        {/* Animated Terminal Demo */}
        <div className="mt-10 sm:mt-16 animate-fade-in-up delay-400">
          <LiveTerminal stats={liveStats} />
        </div>

        {/* Stats */}
        <div ref={statsRef} className="mt-10 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-fade-in-up delay-500">
          {statConfigs.map((config) => (
            <AnimatedStat key={config.label} config={config} animate={statsVisible} />
          ))}
        </div>

        {/* Live Products */}
        <div className="mt-10 sm:mt-14 animate-fade-in-up delay-600">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Live Products</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-3xl mx-auto">
            {[
              { label: 'UltraProbe', desc: 'AI 安全掃描器', href: '/probe', color: '#F59E0B' },
              { label: 'AI Agents', desc: 'AI 品牌推廣 Agents', href: '/agent', color: '#FF6B35' },
              { label: 'Blog', desc: '技術部落格', href: '/blog', color: '#06B6D4' },
            ].map((p) => (
              <a
                key={p.label}
                href={p.href}
                className="group flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 w-[calc(33%-4px)] sm:w-auto"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  borderColor: `${p.color}25`,
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${p.color}60`
                  e.currentTarget.style.boxShadow = `0 0 20px ${p.color}20`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${p.color}25`
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">{p.label}</span>
                <ArrowRight size={12} className="text-slate-600 group-hover:text-white transition-colors shrink-0 hidden sm:block" />
              </a>
            ))}
          </div>
        </div>

        {/* Tech Marquee */}
        <div className="mt-8 animate-fade-in-up delay-700">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Technology Stack</p>
          <TechMarquee />
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="pb-8" />
    </section>
  )
}
