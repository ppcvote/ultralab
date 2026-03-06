import { useInView } from '../hooks/useInView'

/* ── Product Status Data ── */
interface ProductStatus {
  name: string
  status: 'live' | 'beta'
  color: string
  metric: string
  metricLabel: string
  url: string
  external?: boolean
}

const products: ProductStatus[] = [
  { name: 'MindThread', status: 'live', color: '#CE4DFF', metric: 'SaaS', metricLabel: '台灣零競品 · 主力', url: 'https://mindthread.tw', external: true },
  { name: 'AI Agents', status: 'live', color: '#FF6B35', metric: '4', metricLabel: '活躍 Agents · 主力', url: '/agent' },
  { name: 'UltraProbe', status: 'live', color: '#F59E0B', metric: '19', metricLabel: '攻擊向量', url: '/probe' },
  { name: 'Ultra Advisor', status: 'live', color: '#2E6BFF', metric: 'MDRT', metricLabel: '財務顧問平台', url: 'https://www.ultra-advisor.tw', external: true },
]

/* ── Status Board ── */
function StatusBoard({ visible }: { visible: boolean }) {
  return (
    <div
      className={`w-full max-w-4xl mx-auto rounded-2xl overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{
        background: 'rgba(8, 5, 18, 0.95)',
        border: '1px solid rgba(138, 92, 255, 0.15)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(138,92,255,0.06)',
      }}
    >
      {/* Title Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
        <span
          className="ml-2 text-[11px] text-slate-600"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ultra-lab — product-fleet-status
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-500/70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>4 products online</span>
        </div>
      </div>

      {/* Terminal Header */}
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="text-green-400">$</span>
          <span>ultra-lab status --all</span>
          <span className="animate-pulse text-purple-400">_</span>
        </div>
      </div>

      {/* Table Header */}
      <div
        className="hidden sm:grid grid-cols-[1fr_80px_100px_1fr] gap-2 px-6 py-2 text-[10px] text-slate-600 uppercase tracking-wider"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderBottom: '1px solid rgba(138,92,255,0.08)' }}
      >
        <span>Product</span>
        <span>Status</span>
        <span>Key Metric</span>
        <span>URL</span>
      </div>

      {/* Product Rows */}
      <div className="px-4 sm:px-6 py-3 space-y-2">
        {products.map((p, i) => (
          <a
            key={p.name}
            href={p.url}
            {...(p.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={`grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_1fr] gap-1 sm:gap-2 items-center rounded-lg px-3 py-3 sm:py-2.5 transition-all duration-300 hover:bg-[rgba(138,92,255,0.06)] group ${
              visible ? 'animate-fade-in' : 'opacity-0'
            }`}
            style={{
              background: 'rgba(15,10,30,0.4)',
              border: '1px solid rgba(138,92,255,0.06)',
              animationDelay: `${(i + 1) * 0.15}s`,
            }}
          >
            {/* Name */}
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color, boxShadow: `0 0 10px ${p.color}60` }} />
              <span className="text-sm font-semibold text-white group-hover:text-slate-100" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.name}</span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5 sm:justify-start ml-5 sm:ml-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] text-green-400 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {p.status}
              </span>
            </div>

            {/* Metric */}
            <div className="ml-5 sm:ml-0">
              <span className="text-[12px] font-bold" style={{ color: p.color, fontFamily: "'JetBrains Mono', monospace" }}>{p.metric}</span>
              <span className="text-[10px] text-slate-600 ml-1.5">{p.metricLabel}</span>
            </div>

            {/* URL */}
            <div className="hidden sm:block">
              <span className="text-[11px] text-slate-600 group-hover:text-slate-400 transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {p.url.replace('https://', '').replace('http://', '')}
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Summary */}
      <div className="px-6 py-3" style={{ borderTop: '1px solid rgba(138,92,255,0.08)' }}>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span><span className="text-green-400">4</span> products online</span>
          <span className="text-slate-700">·</span>
          <span><span className="text-purple-400">100%</span> self-built</span>
          <span className="text-slate-700">·</span>
          <span><span className="text-blue-400">0</span> downtime</span>
          <span className="text-slate-700">·</span>
          <span><span className="text-amber-400">React + Firebase + Vercel</span> stack</span>
        </div>
      </div>
    </div>
  )
}

/* ── Product Showcase Section ── */
export default function ProductShowcase() {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  return (
    <section ref={ref} id="product-demo" className="relative py-24 lg:py-32 bg-lab overflow-hidden" aria-label="產品狀態看板">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(138,92,255,0.08) 0%, transparent 60%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="terminal-tag mb-4">ultra-lab status --fleet</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            四個產品，<span className="text-gradient-purple">全部上線中</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            不是 mockup，不是規劃 — 是正在生產環境運行的 AI 產品
          </p>
        </div>

        {/* Status Board */}
        <StatusBoard visible={isInView} />
      </div>
    </section>
  )
}
