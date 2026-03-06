import { useState, type FormEvent } from 'react'
import { Send, CheckCircle, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react'
import { useInView } from '../../hooks/useInView'

interface FormData {
  name: string
  phone: string
  email: string
  message: string
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function CTA() {
  const { ref, isInView } = useInView({ threshold: 0.2 })
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    message: '',
  })
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const base = 'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]'
  const hidden = 'opacity-0 translate-y-6'
  const visible = 'opacity-100 translate-y-0'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (submitState === 'error') setSubmitState('idle')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrorMsg('請輸入有效的 Email 地址')
      setSubmitState('error')
      return
    }
    if (!/^[\d\-+() ]{7,20}$/.test(form.phone)) {
      setErrorMsg('請輸入有效的電話號碼')
      setSubmitState('error')
      return
    }

    setSubmitState('submitting')
    try {
      const { getDb } = await import('../../lib/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const db = getDb()
      await addDoc(collection(db, 'inquiries'), {
        name: form.name,
        phone: form.phone,
        email: form.email,
        message: form.message,
        service: 'minyi-consultation',
        source: 'minyi-page',
        createdAt: serverTimestamp(),
      })
      // Fire-and-forget notification
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          service: 'minyi-consultation',
          source: 'minyi-page',
        }),
      }).catch(() => {})
      setSubmitState('success')
      setForm({ name: '', phone: '', email: '', message: '' })
    } catch {
      setErrorMsg('送出失敗，請稍後再試')
      setSubmitState('error')
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm'

  return (
    <section ref={ref} className="px-6 pb-10">
      <div
        className={`max-w-md mx-auto ${base} ${isInView ? visible : hidden}`}
      >
        {/* Section label */}
        <p
          className="text-[10px] uppercase tracking-widest text-slate-400 mb-6 text-center"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Contact
        </p>

        {/* Success state */}
        {submitState === 'success' ? (
          <div
            className="text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"
            style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.08)' }}
          >
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              收到你的訊息了！
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              加我的 LINE 讓我們直接聊
            </p>
            <a
              href="https://line.me/ti/p/~risky9763"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{ background: '#06C755' }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              加 LINE 好友
            </a>
            <p className="text-[11px] text-slate-400 mt-3">
              LINE ID: risky9763
            </p>
            <button
              onClick={() => setSubmitState('idle')}
              className="text-xs text-slate-400 hover:text-blue-500 mt-3 transition-colors"
            >
              再送一則訊息
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 space-y-4"
            style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.08)' }}
          >
            <div className="text-center mb-2">
              <h3 className="text-lg font-semibold text-slate-800">
                預約免費諮詢
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                留下聯繫方式，我會主動與你聯繫
              </p>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="minyi-name"
                className="block text-xs text-slate-500 mb-1 font-medium"
              >
                姓名 <span className="text-red-400">*</span>
              </label>
              <input
                id="minyi-name"
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="你的姓名"
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="minyi-phone"
                className="block text-xs text-slate-500 mb-1 font-medium"
              >
                電話 <span className="text-red-400">*</span>
              </label>
              <input
                id="minyi-phone"
                type="tel"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="09xx-xxx-xxx"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="minyi-email"
                className="block text-xs text-slate-500 mb-1 font-medium"
              >
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="minyi-email"
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="minyi-message"
                className="block text-xs text-slate-500 mb-1 font-medium"
              >
                想聊什麼 <span className="text-red-400">*</span>
              </label>
              <input
                id="minyi-message"
                type="text"
                name="message"
                required
                value={form.message}
                onChange={handleChange}
                placeholder="例：想了解退休規劃 / 保單健檢 / 資產配置"
                className={inputClass}
              />
            </div>

            {/* Error message */}
            {submitState === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle size={14} />
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitState === 'submitting'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-none"
              style={{ boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
            >
              {submitState === 'submitting' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  送出中...
                </>
              ) : (
                <>
                  <Send size={16} />
                  送出諮詢
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              免費 · 無壓力 · 24 小時內回覆
            </p>
          </form>
        )}

        {/* Ultra Advisor link */}
        <div className="text-center mt-5">
          <a
            href="https://www.ultra-advisor.tw/booking"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-500 transition-colors"
          >
            想先自己做財務健檢？
            <span className="text-blue-500 font-medium">Ultra Advisor</span>
            <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
    </section>
  )
}
