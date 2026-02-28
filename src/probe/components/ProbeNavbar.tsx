export default function ProbeNavbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-[rgba(59,130,246,0.08)]" style={{ background: 'rgba(10, 10, 18, 0.85)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <a href="/probe" className="flex items-center gap-2.5">
          <img
            src="/ultraprobe-logo.svg"
            alt="UltraProbe Logo"
            className="w-8 h-8"
            style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))' }}
          />
          <span className="text-base font-[800] tracking-tight">
            <span className="text-white">ULTRA</span>
            <span className="text-gradient-probe">PROBE</span>
          </span>
        </a>

        <a
          href="/"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          powered by Ultra Lab
        </a>
      </div>
    </nav>
  )
}
