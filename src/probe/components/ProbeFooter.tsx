import { ArrowUpRight } from 'lucide-react'

export default function ProbeFooter() {
  return (
    <footer className="border-t border-[rgba(59,130,246,0.06)] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          UltraProbe by Ultra Lab &middot; 傲創實業有限公司
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Ultra Lab <ArrowUpRight size={10} />
          </a>
          <a
            href="/#contact"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            聯繫我們 <ArrowUpRight size={10} />
          </a>
        </div>
      </div>
    </footer>
  )
}
