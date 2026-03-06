import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCart } from '../../lib/cart'

interface CheckoutFormProps {
  onBack: () => void
}

export default function CheckoutForm({ onBack }: CheckoutFormProps) {
  const { items, totalAmount, dispatch } = useCart()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formRef = useRef<HTMLFormElement>(null)
  const [payuniData, setPayuniData] = useState<{
    action: string
    MerID: string
    Version: string
    EncryptInfo: string
    HashInfo: string
  } | null>(null)

  const hasPhysical = items.some((i) => i.type === 'physical')

  // Auto-submit hidden form to PAYUNi when data is ready
  useEffect(() => {
    if (payuniData && formRef.current) {
      formRef.current.submit()
    }
  }, [payuniData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/payuni-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          customer: {
            name,
            email,
            phone,
            ...(hasPhysical && address ? { address } : {}),
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '發生錯誤，請稍後再試')
        setLoading(false)
        return
      }

      // Clear cart before redirecting
      dispatch({ type: 'CLEAR' })

      // Set PAYUNi form data — will auto-submit via useEffect
      setPayuniData(data)
    } catch {
      setError('網路錯誤，請檢查連線後再試')
      setLoading(false)
    }
  }

  const inputClass =
    'w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:ring-1 focus:ring-slate-200'

  return (
    <div className="px-5 py-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        返回購物車
      </button>

      <h2 className="text-base font-semibold text-slate-800 mb-4">結帳資訊</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">姓名 *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="王小明"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">手機 *</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            className={inputClass}
          />
        </div>

        {hasPhysical && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">寄送地址 *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="台北市大安區..."
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Order summary */}
        <div className="bg-slate-50 rounded-xl p-3 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">
              {items.length} 件商品
            </span>
            <span
              className="text-lg font-bold text-slate-900"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              NT${totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all duration-200 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              處理中...
            </>
          ) : (
            `確認付款 NT$${totalAmount.toLocaleString()}`
          )}
        </button>

        <p className="text-[10px] text-slate-400 text-center">
          點擊後將導向 PAYUNi 安全付款頁面
        </p>
      </form>

      {/* Hidden form for PAYUNi redirect */}
      {payuniData && (
        <form
          ref={formRef}
          action={payuniData.action}
          method="POST"
          style={{ display: 'none' }}
        >
          <input name="MerID" value={payuniData.MerID} readOnly />
          <input name="Version" value={payuniData.Version} readOnly />
          <input name="EncryptInfo" value={payuniData.EncryptInfo} readOnly />
          <input name="HashInfo" value={payuniData.HashInfo} readOnly />
        </form>
      )}
    </div>
  )
}
