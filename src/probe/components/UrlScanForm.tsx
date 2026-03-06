import { useState } from 'react'
import { Radar } from 'lucide-react'
import type { ScanState, ScanResult } from '../lib/probe-types'

interface Props {
  onScan: (input: string) => Promise<void>
  scanState: ScanState
  error: string | null
  remaining: number | null
  result: ScanResult | null
}

export default function UrlScanForm({ onScan, scanState, error, remaining }: Props) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let cleanUrl = url.trim()
    if (cleanUrl && !cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl
    }
    if (cleanUrl) onScan(cleanUrl)
  }

  const isValid = url.trim().length > 0

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6">
      <form onSubmit={handleSubmit}>
        <div className="card-probe">
          <label
            className="block text-xs text-slate-500 uppercase tracking-wider mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            目標網址
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-3 rounded-xl bg-[rgba(10,10,18,0.8)] border border-[rgba(59,130,246,0.15)] text-white placeholder-slate-600 outline-none transition-all duration-300 focus:border-[#3B82F6] focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}
              disabled={scanState === 'scanning'}
            />
          </div>

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
            className="btn-probe"
          >
            <Radar size={18} />
            {scanState === 'scanning' ? '掃描中...' : '掃描 URL'}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-xs text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        分析網頁 HTML 偵測 AI/Chatbot 元件，不儲存任何資料。
      </p>
    </section>
  )
}
