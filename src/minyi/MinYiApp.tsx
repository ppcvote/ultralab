import { useState, useEffect } from 'react'
import { CartProvider } from '../lib/cart'
import MinYiHero from './components/MinYiHero'
import Expertise from './components/Expertise'
import CTA from './components/CTA'
import BrandPortals from './components/BrandPortals'
import Shop from './components/Shop'
import Cart from './components/Cart'
import MinYiFooter from './components/MinYiFooter'

function OrderToast() {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const order = params.get('order')
    if (order === 'success') {
      setMessage({ text: '付款成功！感謝您的購買', type: 'success' })
    } else if (order === 'failed') {
      setMessage({ text: '付款未完成，請稍後再試', type: 'error' })
    } else if (order === 'error') {
      setMessage({ text: '發生錯誤，請聯繫我們', type: 'error' })
    }

    // Clean URL
    if (order) {
      window.history.replaceState({}, '', '/minyi')
    }
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (!message) return null

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg animate-[slideDown_0.3s_ease-out] ${
      message.type === 'success'
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {message.text}
    </div>
  )
}

function useMinYiMeta() {
  useEffect(() => {
    document.title = 'Min Yi — 謝民義 | MDRT 財務顧問 × 認證退休規劃師'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#FAFAFA')
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', 'light')

    const ogTags: Record<string, string> = {
      'og:title': 'Min Yi — 幫你看清風險，規劃每一步',
      'og:description': 'MDRT 百萬圓桌會員 × IARFC 國際認證財務顧問師。10 年經驗、3000+ 位客戶、累計規劃資產 17 億+。',
      'og:url': 'https://ultralab.tw/minyi',
      'og:image': 'https://ultralab.tw/og-minyi.png',
    }
    for (const [prop, content] of Object.entries(ogTags)) {
      let el = document.querySelector(`meta[property="${prop}"]`)
      if (el) {
        el.setAttribute('content', content)
      } else {
        el = document.createElement('meta')
        el.setAttribute('property', prop)
        el.setAttribute('content', content)
        document.head.appendChild(el)
      }
    }

    return () => {
      document.title = 'Ultra Lab — 全自動社群發布 × AI 內容生成 × SaaS 建置 | 傲創實業技術服務'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0A0515')
      document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', 'dark')
    }
  }, [])
}

export default function MinYiApp() {
  useMinYiMeta()

  return (
    <CartProvider>
      <div
        className="min-h-screen bg-[#FAFAFA] text-slate-800"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        <OrderToast />
        <MinYiHero />
        <Expertise />
        <CTA />
        <BrandPortals />
        <Shop />
        <MinYiFooter />
        <Cart />
      </div>
    </CartProvider>
  )
}
