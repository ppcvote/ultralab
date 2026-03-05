import { useState, type FormEvent } from 'react'
import { Send, CheckCircle, AlertCircle, Loader2, MessageCircle, Mail } from 'lucide-react'
import { trackFormSubmit, trackCTAClick } from '../lib/analytics'
import { useInView } from '../hooks/useInView'

const SERVICE_OPTIONS = [
  'IG Reel 全自動發布系統',
  'MindThread — Threads 自動化 SaaS',
  'SaaS 全端建置方案',
  'AI 串接應用服務',
  '品牌官網全套方案',
  'AI 資安防護服務',
  'Ultra KB 知識中樞建置',
  '技術諮詢（一對一）',
  '還不確定，想先聊聊',
]

const CONTACT_METHODS = [
  { value: 'line', label: 'LINE' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: '電話' },
]

interface FormData {
  name: string
  email: string
  phone: string
  lineId: string
  contactMethod: string
  company: string
  service: string
  budget: string
  message: string
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function Contact() {
  const { ref, isInView } = useInView({ threshold: 0.1 })
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    lineId: '',
    contactMethod: 'line',
    company: '',
    service: '',
    budget: '',
    message: '',
  })
  const [submitState, setSubmitState] = useState<SubmitState>('idle')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setSubmitState('error')
      return
    }
    if (form.phone && !/^[\d\-+() ]{7,20}$/.test(form.phone)) {
      setSubmitState('error')
      return
    }

    setSubmitState('submitting')
    try {
      const { getDb } = await import('../lib/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const db = getDb()
      await addDoc(collection(db, 'inquiries'), {
        ...form,
        createdAt: serverTimestamp(),
        source: 'landing-page',
      })
      trackFormSubmit(form.service)
      // Send email notification (fire-and-forget, don't block UI)
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).catch(() => {})
      setSubmitState('success')
      setForm({ name: '', email: '', phone: '', lineId: '', contactMethod: 'line', company: '', service: '', budget: '', message: '' })
    } catch {
      setSubmitState('error')
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-[rgba(15,10,30,0.8)] border border-[rgba(138,92,255,0.2)] text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#8A5CFF] focus:shadow-[0_0_20px_rgba(138,92,255,0.15)]'

  return (
    <section id="contact" className="relative py-24 lg:py-32 overflow-hidden" ref={ref}>
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(138, 92, 255, 0.15) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, #0A0515 0%, #0D0822 30%, #0D0822 70%, #0A0515 100%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="terminal-tag mb-6">ssh contact@ultralab.tw</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            準備好用 AI
            <br />
            <span className="text-gradient-purple">驅動你的業務了嗎？</span>
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            填寫表單，我們會在 24 小時內回覆 — 從 AI 諮詢到系統上線，全程支援
          </p>
        </div>

        {/* Success state */}
        {submitState === 'success' ? (
          <div
            className={`card-lab text-center py-16 ${
              isInView ? 'animate-fade-in-up delay-200' : 'opacity-0'
            }`}
          >
            <CheckCircle size={48} className="mx-auto mb-4 text-[#10B981]" />
            <h3 className="text-xl font-bold text-white mb-2">收到你的訊息了！</h3>
            <p className="text-slate-400 mb-6">我們會在 24 小時內透過你偏好的方式聯繫你</p>
            <button
              onClick={() => setSubmitState('idle')}
              className="text-sm text-[#CE4DFF] hover:underline"
            >
              再送一則訊息
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`card-lab p-6 sm:p-8 space-y-5 ${
              isInView ? 'animate-fade-in-up delay-200' : 'opacity-0'
            }`}
          >
            {/* Row 1: Name + Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="f-name" className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  姓名 <span className="text-[#CE4DFF]">*</span>
                </label>
                <input id="f-name" type="text" name="name" required value={form.name} onChange={handleChange} placeholder="你的姓名" className={inputClass} />
              </div>
              <div>
                <label htmlFor="f-company" className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  公司 / 品牌
                </label>
                <input id="f-company" type="text" name="company" value={form.company} onChange={handleChange} placeholder="選填" className={inputClass} />
              </div>
            </div>

            {/* Row 2: Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label htmlFor="f-lineId" className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  LINE ID
                </label>
                <input id="f-lineId" type="text" name="lineId" value={form.lineId} onChange={handleChange} placeholder="你的 LINE ID" className={inputClass} />
              </div>
              <div>
                <label htmlFor="f-email" className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Email <span className="text-[#CE4DFF]">*</span>
                </label>
                <input id="f-email" type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label htmlFor="f-phone" className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  電話
                </label>
                <input id="f-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="09xx-xxx-xxx" className={inputClass} />
              </div>
            </div>

            {/* Row 3: Preferred contact method */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                偏好的聯繫方式 <span className="text-[#CE4DFF]">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {CONTACT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all border ${
                      form.contactMethod === m.value
                        ? 'border-[rgba(138,92,255,0.5)] text-white'
                        : 'border-[rgba(138,92,255,0.15)] text-slate-500 hover:border-[rgba(138,92,255,0.3)]'
                    }`}
                    style={{ background: form.contactMethod === m.value ? 'rgba(138,92,255,0.1)' : 'rgba(15,10,30,0.5)' }}
                  >
                    <input
                      type="radio"
                      name="contactMethod"
                      value={m.value}
                      checked={form.contactMethod === m.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Row 4: Service + Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="f-service" className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  感興趣的服務 <span className="text-[#CE4DFF]">*</span>
                </label>
                <select id="f-service" name="service" required value={form.service} onChange={handleChange} className={`${inputClass} ${!form.service ? 'text-slate-500' : ''}`}>
                  <option value="" disabled>選擇服務項目</option>
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-budget" className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  預算範圍
                </label>
                <select id="f-budget" name="budget" value={form.budget} onChange={handleChange} className={`${inputClass} ${!form.budget ? 'text-slate-500' : ''}`}>
                  <option value="" disabled>選填</option>
                  <option value="under-3k">NT$3,000 以下</option>
                  <option value="3k-10k">NT$3,000 – 10,000</option>
                  <option value="10k-30k">NT$10,000 – 30,000</option>
                  <option value="30k-80k">NT$30,000 – 80,000</option>
                  <option value="80k+">NT$80,000 以上</option>
                  <option value="discuss">需要討論</option>
                </select>
              </div>
            </div>

            {/* Row 5: Message */}
            <div>
              <label htmlFor="f-message" className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                需求描述
              </label>
              <textarea
                id="f-message"
                name="message"
                rows={3}
                value={form.message}
                onChange={handleChange}
                placeholder="簡單描述你想解決的問題（選填）"
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Error message */}
            {submitState === 'error' && (
              <div className="flex items-center gap-2 text-sm text-[#FF6A6A]">
                <AlertCircle size={16} />
                送出失敗，請稍後再試或直接 Email 至 contact@ultralab.tw
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitState === 'submitting'}
              className="group w-full inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-white rounded-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
                boxShadow: '0 0 30px rgba(138, 92, 255, 0.4)',
              }}
              onMouseEnter={(e) => {
                if (submitState !== 'submitting')
                  e.currentTarget.style.boxShadow = '0 0 50px rgba(138, 92, 255, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(138, 92, 255, 0.4)'
              }}
            >
              {submitState === 'submitting' ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  送出中...
                </>
              ) : (
                <>
                  <Send size={20} />
                  送出諮詢
                </>
              )}
            </button>

            {/* Trust signal */}
            <p
              className="text-center text-sm text-slate-600"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              免費 · 無壓力 · 24 小時內回覆
            </p>
          </form>
        )}

        {/* Quick Contact Options */}
        <div
          className={`mt-10 ${isInView ? 'animate-fade-in-up delay-400' : 'opacity-0'}`}
        >
          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[rgba(138,92,255,0.15)]" />
            <span className="text-sm text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              或直接聯繫
            </span>
            <div className="flex-1 h-px bg-[rgba(138,92,255,0.15)]" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Threads DM */}
            <a
              href="https://www.threads.net/@ultralab.tw"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick('Threads私訊')}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-white rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
                boxShadow: '0 0 20px rgba(138, 92, 255, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 40px rgba(138, 92, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(138, 92, 255, 0.3)'
              }}
            >
              <MessageCircle size={20} />
              Threads 私訊我們
            </a>

            {/* Email link */}
            <a
              href="mailto:contact@ultralab.tw"
              onClick={() => trackCTAClick('Email聯繫')}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-slate-300 rounded-xl border border-[rgba(138,92,255,0.3)] hover:border-[#8A5CFF] hover:text-white transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: 'rgba(138, 92, 255, 0.05)' }}
            >
              <Mail size={20} />
              Email 聯繫
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}