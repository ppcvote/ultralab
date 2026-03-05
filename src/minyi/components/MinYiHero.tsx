import { useState, useEffect } from 'react'
import { Instagram, AtSign, Mail } from 'lucide-react'

const SOCIAL_LINKS = [
  { icon: Instagram, href: 'https://www.instagram.com/min_yi_510_/', label: 'Instagram', hoverColor: '#E1306C' },
  { icon: AtSign, href: 'https://www.threads.net/@min_yi_510_', label: 'Threads', hoverColor: '#000000' },
  { icon: Mail, href: 'mailto:contact@ultralab.tw', label: 'Email', hoverColor: '#6366F1' },
]

const CERTIFICATIONS = ['MDRT', 'ChRP', 'IARFC', 'AIAM']

export default function MinYiHero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const base = 'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]'
  const hidden = 'opacity-0 translate-y-6'
  const visible = 'opacity-100 translate-y-0'

  return (
    <section className="pt-16 pb-8 px-6 text-center">
      {/* Avatar */}
      <div
        className={`relative mx-auto w-28 h-28 md:w-36 md:h-36 mb-6 ${base} ${mounted ? visible : hidden}`}
      >
        <div
          className="absolute inset-0 rounded-full animate-[pulseRing_3s_ease-out_infinite]"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="relative w-full h-full rounded-full border-[3px] border-white flex items-center justify-center text-3xl md:text-4xl font-bold overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
            boxShadow: '0 8px 30px rgba(30, 64, 175, 0.25)',
          }}
        >
          {/* TODO: Replace with <img src="/avatar-minyi.jpg" alt="Min Yi" className="w-full h-full object-cover" /> */}
          <span className="text-white">MY</span>
        </div>
      </div>

      {/* Name */}
      <h1
        className={`text-3xl md:text-4xl font-bold text-slate-900 mb-1 ${base} ${mounted ? visible : hidden}`}
        style={{ transitionDelay: '80ms' }}
      >
        Min Yi
      </h1>
      <p
        className={`text-slate-500 text-sm mb-3 ${base} ${mounted ? visible : hidden}`}
        style={{ transitionDelay: '120ms' }}
      >
        謝民義
      </p>

      {/* Certifications — international credentials */}
      <div
        className={`flex items-center justify-center gap-2 flex-wrap mb-4 ${base} ${mounted ? visible : hidden}`}
        style={{ transitionDelay: '180ms' }}
      >
        {CERTIFICATIONS.map((cert) => (
          <span
            key={cert}
            className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] text-blue-700 font-semibold tracking-wide"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {cert}
          </span>
        ))}
      </div>

      {/* Title */}
      <p
        className={`text-[11px] text-slate-400 uppercase tracking-widest mb-5 ${base} ${mounted ? visible : hidden}`}
        style={{ fontFamily: "'JetBrains Mono', monospace", transitionDelay: '240ms' }}
      >
        Founder, Ultra Creation Co., Ltd.
      </p>

      {/* Tagline — pure financial advisor focus */}
      <p
        className={`text-slate-600 text-sm max-w-xs mx-auto mb-2 leading-relaxed ${base} ${mounted ? visible : hidden}`}
        style={{ transitionDelay: '300ms' }}
      >
        幫你看清風險，規劃每一步。<br />
        讓每一分錢都發揮最大的價值。
      </p>
      <p
        className={`text-[11px] text-slate-400 max-w-xs mx-auto mb-8 ${base} ${mounted ? visible : hidden}`}
        style={{ fontFamily: "'JetBrains Mono', monospace", transitionDelay: '360ms' }}
      >
        Protect. Plan. Prosper.
      </p>

      {/* Social Links */}
      <div
        className={`flex items-center justify-center gap-3 ${base} ${mounted ? visible : hidden}`}
        style={{ transitionDelay: '420ms' }}
      >
        {SOCIAL_LINKS.map(({ icon: Icon, href, label, hoverColor }, i) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 bg-white border border-slate-200 hover:border-slate-300 ${base} ${mounted ? visible : hidden}`}
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transitionDelay: `${480 + i * 50}ms`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 4px 16px ${hoverColor}25`
              e.currentTarget.style.color = hoverColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
              e.currentTarget.style.color = ''
            }}
          >
            <Icon size={18} className="text-slate-500" />
          </a>
        ))}
      </div>
    </section>
  )
}
