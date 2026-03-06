export default function ScanAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Radar */}
      <div className="relative w-32 h-32">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-[rgba(59,130,246,0.2)]" />
        {/* Middle ring */}
        <div
          className="absolute inset-4 rounded-full border border-[rgba(255,58,58,0.15)]"
          style={{ animation: 'scan-pulse 2s ease-in-out infinite' }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-8 rounded-full border border-[rgba(59,130,246,0.2)]"
          style={{ animation: 'scan-pulse 2s ease-in-out infinite 0.5s' }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#FF3A3A]" style={{ boxShadow: '0 0 12px rgba(255,58,58,0.6)' }} />
        </div>
        {/* Sweep */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59,130,246,0.15) 60deg, transparent 120deg)',
            animation: 'radar-sweep 2s linear infinite',
          }}
        />
      </div>

      <p
        className="mt-6 text-sm text-slate-400"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        掃描中
        <span style={{ animation: 'typing-cursor 1s step-end infinite' }}>_</span>
      </p>
    </div>
  )
}
