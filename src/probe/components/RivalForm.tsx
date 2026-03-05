import { useState } from 'react'
import { Target, AlertTriangle } from 'lucide-react'
import type { ScanState, ScanResult } from '../lib/probe-types'

interface Props {
  onScan: (input: string, manualContent?: string) => Promise<void>
  scanState: ScanState
  error: string | null
  remaining: number | null
  result: ScanResult | null
  needsManualInput: boolean
  partialContent: string
}

export default function RivalForm({ onScan, scanState, error, remaining, needsManualInput, partialContent }: Props) {
  const [url, setUrl] = useState('')
  const [manual, setManual] = useState('')

  // Pre-fill manual textarea when partialContent arrives
  const displayManual = manual || partialContent

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let cleanUrl = url.trim()
    if (cleanUrl && !cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl
    }
    if (!cleanUrl) return

    if (needsManualInput) {
      const content = displayManual.trim()
      if (content.length >= 100) {
        onScan(cleanUrl, content)
      }
    } else {
      onScan(cleanUrl)
    }
  }

  const isValid = needsManualInput
    ? url.trim().length > 0 && displayManual.trim().length >= 100
    : url.trim().length > 0

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6">
      <form onSubmit={handleSubmit}>
        <div className="card-probe !border-[rgba(138,92,255,0.2)]">
          <label
            className="block text-xs text-slate-500 uppercase tracking-wider mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            對手帳號 URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.threads.net/@competitor"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(10,10,18,0.8)] border border-[rgba(138,92,255,0.15)] text-white placeholder-slate-600 outline-none transition-all duration-300 focus:border-[#8A5CFF] focus:shadow-[0_0_20px_rgba(138,92,255,0.1)]"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}
            disabled={scanState === 'scanning'}
          />

          {/* Manual input fallback */}
          {needsManualInput && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-[#F59E0B]" />
                <span className="text-xs text-[#F59E0B]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  無法自動擷取，請手動貼上內容
                </span>
              </div>
              <label
                className="block text-xs text-slate-500 uppercase tracking-wider mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                貼上對手貼文內容（至少 100 字）
              </label>
              <textarea
                value={displayManual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="複製對手的最近 3-5 則貼文內容貼在這裡..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl bg-[rgba(10,10,18,0.8)] border border-[rgba(138,92,255,0.15)] text-white placeholder-slate-600 outline-none transition-all duration-300 focus:border-[#8A5CFF] focus:shadow-[0_0_20px_rgba(138,92,255,0.1)] resize-none text-sm"
                disabled={scanState === 'scanning'}
              />
              <div className="mt-1 text-right">
                <span
                  className={`text-xs ${displayManual.trim().length >= 100 ? 'text-[#10B981]' : 'text-slate-600'}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {displayManual.trim().length.toLocaleString()} / 10,000
                </span>
              </div>
            </div>
          )}

          {remaining !== null && (
            <div className="mt-3 text-right">
              <span className="text-xs text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                剩餘 {remaining} 次
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl border border-[rgba(255,58,58,0.3)] bg-[rgba(255,58,58,0.05)] text-sm text-[#FF6A6A]">
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="submit"
            disabled={!isValid || scanState === 'scanning'}
            className="inline-flex items-center gap-3 px-8 py-4 text-base font-bold text-white rounded-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
            style={{
              background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
              boxShadow: '0 0 30px rgba(138,92,255,0.3)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Target size={18} />
            {scanState === 'scanning' ? '分析中...' : needsManualInput ? '用手動內容分析' : '分析對手'}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-xs text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        分析公開社群內容，不儲存任何資料。
      </p>
    </section>
  )
}
