import { useState } from 'react'
import { Mail, Unlock, Loader2 } from 'lucide-react'

interface Props {
  totalVulns: number
  freeLimit: number
  scanType: string
  onUnlock: () => void
}

export default function EmailGate({ totalVulns, freeLimit, scanType, onUnlock }: Props) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const remaining = totalVulns - freeLimit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('請輸入有效的 Email')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/probe-collect-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, scanType }),
      })
      if (!res.ok) throw new Error()
      onUnlock()
    } catch {
      setError('送出失敗，請稍後再試。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative my-6">
      <div className="card-probe text-center py-8 px-6 border-[rgba(255,58,58,0.2)]" style={{ background: 'rgba(255,58,58,0.03)' }}>
        <Unlock size={28} className="mx-auto mb-3 text-[#FF3A3A]" />

        <h3 className="text-lg font-bold text-white mb-1">
          解鎖完整報告
        </h3>
        <p className="text-sm text-slate-400 mb-5">
          還有 {remaining} 個漏洞分析 + 詳細修復建議
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="flex-1 relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[rgba(10,10,18,0.8)] border border-[rgba(59,130,246,0.2)] text-white placeholder-slate-600 outline-none focus:border-[#3B82F6] text-sm"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-probe !px-6 !py-3 !text-sm"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : '解鎖'}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-xs text-[#FF6A6A]">{error}</p>
        )}

        <p className="mt-4 text-xs text-slate-600">
          僅用於寄送報告，不會發送垃圾郵件。
        </p>
      </div>
    </div>
  )
}
