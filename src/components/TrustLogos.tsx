import { useInView } from '../hooks/useInView'

const partners = [
  { name: 'Google Gemini', color: '#4DA3FF' },
  { name: 'Anthropic Claude', color: '#CE4DFF' },
  { name: 'Meta Threads API', color: '#14B8A6' },
  { name: 'Firebase', color: '#F59E0B' },
  { name: 'Vercel Edge', color: '#F8FAFC' },
  { name: 'React', color: '#61DAFB' },
  { name: 'TypeScript', color: '#3178C6' },
  { name: 'FFmpeg GPU', color: '#10B981' },
  { name: 'Playwright', color: '#2EAD33' },
]

export default function TrustLogos() {
  const { ref, isInView } = useInView({ threshold: 0.3 })

  return (
    <section ref={ref} className="relative py-12 lg:py-16 overflow-hidden" aria-label="技術合作夥伴與技術棧">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <p
            className="text-[11px] text-slate-600 uppercase tracking-[0.2em] mb-6"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Technology Partners & Stack
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {partners.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(138,92,255,0.08)] transition-all duration-300 hover:border-[rgba(138,92,255,0.25)] hover:bg-[rgba(138,92,255,0.04)] ${
                  isInView ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{
                  animationDelay: `${i * 0.05}s`,
                  background: 'rgba(15,10,30,0.4)',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: p.color, boxShadow: `0 0 8px ${p.color}40` }}
                />
                <span
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
