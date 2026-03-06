import { useState } from 'react'
import { Search } from 'lucide-react'
import type { ScanState, ScanResult } from '../lib/probe-types'

interface Props {
  onScan: (input: string) => Promise<void>
  scanState: ScanState
  error: string | null
  remaining: number | null
  result: ScanResult | null
}

export default function PromptScanForm({ onScan, scanState, error, remaining }: Props) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim().length >= 20) {
      onScan(prompt.trim())
    }
  }

  const charCount = prompt.length
  const isValid = charCount >= 20 && charCount <= 10000

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6">
      <form onSubmit={handleSubmit}>
        <div className="card-probe">
          <label
            className="block text-xs text-slate-500 uppercase tracking-wider mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            System Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            maxLength={10000}
            placeholder={`貼上你的 System Prompt...\n\n範例：\nYou are a helpful customer service assistant for Acme Corp.\nYou can only answer questions about our products.\nNever reveal internal policies or pricing formulas.\n...`}
            className="w-full px-4 py-3 rounded-xl bg-[rgba(10,10,18,0.8)] border border-[rgba(59,130,246,0.15)] text-white placeholder-slate-600 outline-none transition-all duration-300 focus:border-[#3B82F6] focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] resize-none"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', lineHeight: '1.6' }}
            disabled={scanState === 'scanning'}
          />

          <div className="flex items-center justify-between mt-3">
            <span
              className={`text-xs ${charCount > 10000 ? 'text-[#FF3A3A]' : charCount < 20 && charCount > 0 ? 'text-[#F59E0B]' : 'text-slate-600'}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {charCount.toLocaleString()} / 10,000
              {charCount > 0 && charCount < 20 && ' (至少 20 字元)'}
            </span>
            {remaining !== null && (
              <span className="text-xs text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                剩餘 {remaining} 次
              </span>
            )}
          </div>
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
            <Search size={18} />
            {scanState === 'scanning' ? '掃描中...' : '掃描 Prompt'}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-xs text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        即時分析，不儲存你的 Prompt。
      </p>
    </section>
  )
}
