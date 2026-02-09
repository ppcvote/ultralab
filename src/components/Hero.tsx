import { ArrowRight, ChevronDown } from 'lucide-react'
import { trackCTAClick } from '../lib/analytics'

const stats = [
  { value: '6', label: '大產品線' },
  { value: '端到端', label: '全自動' },
  { value: '零競品', label: '台灣市場' },
  { value: '接案→', label: '產品化' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-lab">
      {/* Purple glow orb — top right */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #8A5CFF 0%, transparent 70%)',
          filter: 'blur(150px)',
        }}
      />
      {/* Secondary glow — bottom left */}
      <div
        className="absolute -bottom-48 -left-48 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #CE4DFF 0%, transparent 70%)',
          filter: 'blur(150px)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-20 lg:pt-40 lg:pb-24">
        {/* Tag */}
        <div className="animate-fade-in-up">
          <span
            className="inline-block px-4 py-1.5 text-xs font-medium tracking-wider uppercase rounded-full border border-[rgba(138,92,255,0.3)] text-[#CE4DFF]"
            style={{
              background: 'rgba(138, 92, 255, 0.08)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            傲創實業 · 技術服務品牌
          </span>
        </div>

        {/* Main Title */}
        <h1
          className="mt-8 text-6xl sm:text-7xl lg:text-9xl font-[800] leading-tight tracking-tight animate-fade-in-up delay-100"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          <span className="text-gradient-hero">Build. Ship. Scale.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-xl sm:text-2xl lg:text-3xl text-slate-200 font-light animate-fade-in-up delay-200">
          把你做過的每一件事，變成別人願意付費的價值。
        </p>

        {/* Description */}
        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto animate-fade-in-up delay-300">
          全自動社群發布 × AI 內容生成 × SaaS 建置 — 從驗證到量產的技術夥伴
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400">
          <a
            href="#contact"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
              boxShadow: '0 0 30px rgba(138, 92, 255, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 50px rgba(138, 92, 255, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(138, 92, 255, 0.4)'
            }}
            onClick={() => trackCTAClick('免費諮詢')}
          >
            免費諮詢
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#services"
            onClick={() => trackCTAClick('查看服務項目')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-slate-300 rounded-xl border border-[rgba(138,92,255,0.3)] hover:border-[#8A5CFF] hover:text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'rgba(138, 92, 255, 0.05)',
            }}
          >
            查看服務項目
            <ChevronDown size={18} />
          </a>
        </div>

        {/* Stats Bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 animate-fade-in-up delay-500">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center p-4 rounded-xl border border-[rgba(138,92,255,0.1)]"
              style={{ background: 'rgba(138, 92, 255, 0.03)' }}
            >
              <div
                className="text-2xl sm:text-3xl font-bold text-gradient-purple"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
