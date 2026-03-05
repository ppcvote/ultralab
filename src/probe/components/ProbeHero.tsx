import { Shield, Globe, Target } from 'lucide-react'
import type { ScanMode } from '../lib/probe-types'

interface Props {
  scanMode: ScanMode
  onModeChange: (mode: ScanMode) => void
}

export default function ProbeHero({ scanMode, onModeChange }: Props) {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(255,58,58,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <span className="terminal-tag-probe mb-6">ultraprobe --scan --mode=ai</span>

        <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-[800] text-white leading-tight">
          你的 AI 有一個{' '}
          <span className="text-gradient-probe">後門。</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
          免費 AI 資安掃描工具。在攻擊者之前，找到 Prompt Injection 漏洞。
        </p>

        {/* Mode selector */}
        <div className="mt-10 inline-flex rounded-xl border border-[rgba(59,130,246,0.15)] overflow-hidden" style={{ background: 'rgba(10,10,18,0.8)' }}>
          <button
            onClick={() => onModeChange('prompt')}
            className={`flex items-center gap-2 px-5 sm:px-6 py-3 text-sm font-semibold transition-all ${
              scanMode === 'prompt'
                ? 'text-white bg-[rgba(255,58,58,0.12)] border-b-2 border-[#FF3A3A]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Shield size={16} />
            Prompt 健檢
          </button>
          <button
            onClick={() => onModeChange('url')}
            className={`flex items-center gap-2 px-5 sm:px-6 py-3 text-sm font-semibold transition-all ${
              scanMode === 'url'
                ? 'text-white bg-[rgba(59,130,246,0.12)] border-b-2 border-[#3B82F6]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Globe size={16} />
            URL 掃描
          </button>
          <button
            onClick={() => onModeChange('rival')}
            className={`flex items-center gap-2 px-5 sm:px-6 py-3 text-sm font-semibold transition-all ${
              scanMode === 'rival'
                ? 'text-white bg-[rgba(138,92,255,0.12)] border-b-2 border-[#8A5CFF]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Target size={16} />
            對手分析
          </button>
        </div>
      </div>
    </section>
  )
}
