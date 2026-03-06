import { ArrowUpRight } from 'lucide-react'
import { useInView } from '../../hooks/useInView'

/* ── Brand Logo SVGs ── */

/** Ultra Lab — intersecting curves (purple × teal) */
function LogoUltraLab() {
  return (
    <svg viewBox="0 0 320 420" className="w-5 h-6">
      <defs>
        <linearGradient id="bp-gp" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CE4DFF" />
          <stop offset="100%" stopColor="#8A5CFF" />
        </linearGradient>
        <linearGradient id="bp-gt" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <path fill="none" stroke="url(#bp-gp)" strokeWidth="22" strokeLinecap="round" d="M 90,40 C 90,160 130,220 242,380" />
      <path fill="none" stroke="url(#bp-gt)" strokeWidth="22" strokeLinecap="round" d="M 230,40 C 230,160 190,220 78,380" />
      <path fill="none" stroke="#E8E0FF" strokeWidth="14" strokeLinecap="round" opacity="0.6" d="M 91.5,314 L 228.5,314" />
    </svg>
  )
}

/** Ultra Advisor — ascending bars + trend line (blue) */
function LogoUltraAdvisor() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <defs>
        <linearGradient id="bp-adv" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      <rect x="3" y="14" width="3" height="7" rx="1" fill="url(#bp-adv)" opacity="0.4" />
      <rect x="8" y="10" width="3" height="11" rx="1" fill="url(#bp-adv)" opacity="0.6" />
      <rect x="13" y="7" width="3" height="14" rx="1" fill="url(#bp-adv)" opacity="0.8" />
      <rect x="18" y="3" width="3" height="18" rx="1" fill="url(#bp-adv)" />
      <path d="M 4.5 12 L 9.5 8 L 14.5 5 L 19.5 2" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Mind Threads — Threads-inspired @ shape (teal) */
function LogoMindThreads() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <defs>
        <linearGradient id="bp-mt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="none" stroke="url(#bp-mt)" strokeWidth="2" />
      <path d="M 16 12 C 16 14.2 14.2 16 12 16 C 9.8 16 8 14.2 8 12 C 8 9.8 9.8 8 12 8 C 14.2 8 16 9.8 16 12 L 16 14.5" fill="none" stroke="url(#bp-mt)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Ultra KB — open book with knowledge graph triangle (green + brown) */
function LogoUltraKB() {
  return (
    <svg viewBox="0 0 36 36" className="w-5 h-5" fill="none">
      <defs>
        <linearGradient id="bp-kb-book" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B7355" />
          <stop offset="100%" stopColor="#6B5B45" />
        </linearGradient>
        <linearGradient id="bp-kb-node" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      {/* Left page */}
      <path d="M4 7 C8 6 14 5.5 18 6 L18 28 C14 27 8 27.5 4 28.5 Z" fill="#F5EFE0" stroke="url(#bp-kb-book)" strokeWidth="1.4" strokeLinejoin="round" />
      {/* Right page */}
      <path d="M32 7 C28 6 22 5.5 18 6 L18 28 C22 27 28 27.5 32 28.5 Z" fill="#F5EFE0" stroke="url(#bp-kb-book)" strokeWidth="1.4" strokeLinejoin="round" />
      {/* Connection lines */}
      <line x1="11" y1="13" x2="25" y2="13" stroke="#059669" strokeWidth="1.2" opacity="0.3" />
      <line x1="11" y1="13" x2="18" y2="22" stroke="#059669" strokeWidth="1.2" opacity="0.3" />
      <line x1="25" y1="13" x2="18" y2="22" stroke="#34D399" strokeWidth="1.2" opacity="0.3" />
      {/* Knowledge nodes */}
      <circle cx="11" cy="13" r="2.5" fill="#059669" />
      <circle cx="25" cy="13" r="2.5" fill="#059669" />
      <circle cx="18" cy="22" r="3" fill="url(#bp-kb-node)" />
    </svg>
  )
}

/** UltraProbe — split shield red/blue */
function LogoUltraProbe() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <defs>
        <linearGradient id="bp-pr" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6A6A" />
          <stop offset="100%" stopColor="#FF3A3A" />
        </linearGradient>
        <linearGradient id="bp-pb" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2E6BFF" />
        </linearGradient>
      </defs>
      {/* Shield left half (red) */}
      <path d="M 12 2 L 4 6 L 4 13 C 4 17 7 20 12 22" fill="none" stroke="url(#bp-pr)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Shield right half (blue) */}
      <path d="M 12 2 L 20 6 L 20 13 C 20 17 17 20 12 22" fill="none" stroke="url(#bp-pb)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Scan line */}
      <path d="M 7 12 L 17 12" fill="none" stroke="#00D4FF" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      {/* Vulnerability dot */}
      <circle cx="12" cy="9" r="1.5" fill="#FF3A3A" opacity="0.8" />
    </svg>
  )
}

/* ── Brand Data ── */

interface Brand {
  name: string
  description: string
  tagline: string
  icon: React.ReactNode
  color: string
  bgLight: string
  href?: string
  featured?: boolean
  comingSoon?: boolean
}

const BRANDS: Brand[] = [
  {
    name: 'Ultra Lab',
    description: '技術服務品牌',
    tagline: '自動化 × SaaS 建置',
    icon: <LogoUltraLab />,
    color: '#7C3AED',
    bgLight: '#F3EEFF',
    href: 'https://ultralab.tw',
    featured: true,
  },
  {
    name: 'Ultra Advisor',
    description: '財務顧問 SaaS',
    tagline: '18+ 種數據視覺化',
    icon: <LogoUltraAdvisor />,
    color: '#2563EB',
    bgLight: '#EFF6FF',
    href: 'https://www.ultra-advisor.tw',
  },
  {
    name: 'Mind Threads',
    description: 'Threads 自動化',
    tagline: '零競品・台灣唯一',
    icon: <LogoMindThreads />,
    color: '#0D9488',
    bgLight: '#F0FDFA',
    href: 'https://mindthread.tw',
  },
  {
    name: 'Ultra KB',
    description: '知識中樞建置',
    tagline: 'Agent-Ready 知識架構',
    icon: <LogoUltraKB />,
    color: '#059669',
    bgLight: '#ECFDF5',
    href: 'https://ultralab.tw/kb',
  },
  {
    name: 'UltraProbe',
    description: 'AI 資安掃描器',
    tagline: '10 種攻擊向量',
    icon: <LogoUltraProbe />,
    color: '#D97706',
    bgLight: '#FFFBEB',
    href: 'https://ultralab.tw/probe',
  },
]

/* ── Component ── */

export default function BrandPortals() {
  const { ref, isInView } = useInView({ threshold: 0.15 })

  const base = 'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]'
  const hidden = 'opacity-0 translate-y-6'
  const visible = 'opacity-100 translate-y-0'

  return (
    <section ref={ref} className="px-6 pb-10">
      {/* Divider before section */}
      <div className="w-8 h-px mx-auto mb-10 bg-slate-200" />

      <p
        className={`text-[10px] uppercase tracking-widest text-slate-400 mb-1.5 text-center ${base} ${isInView ? visible : hidden}`}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        Built by Me
      </p>
      <h2
        className={`text-lg font-semibold text-slate-800 text-center mb-1 ${base} ${isInView ? visible : hidden}`}
        style={{ transitionDelay: '60ms' }}
      >
        我打造的工具
      </h2>
      <p
        className={`text-xs text-slate-400 text-center mb-5 ${base} ${isInView ? visible : hidden}`}
        style={{ transitionDelay: '100ms' }}
      >
        從 AI 自動化到資安防護，全部自己打造
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto md:max-w-2xl">
        {BRANDS.map((brand, i) => {
          const Tag = brand.comingSoon ? 'div' : 'a'
          const linkProps = brand.comingSoon
            ? {}
            : { href: brand.href, target: '_blank', rel: 'noopener noreferrer' }

          return (
            <Tag
              key={brand.name}
              {...linkProps}
              className={`group block rounded-2xl p-4 bg-white border transition-all duration-200 ${
                brand.comingSoon ? 'opacity-60 cursor-default' : 'hover:scale-[1.02]'
              } ${
                brand.featured ? 'border-purple-200 ring-1 ring-purple-100' : 'border-slate-100 hover:border-slate-200'
              } ${base} ${isInView ? visible : hidden}`}
              style={{
                boxShadow: brand.featured
                  ? '0 4px 16px rgba(124,58,237,0.08)'
                  : '0 2px 8px rgba(0,0,0,0.04)',
                transitionDelay: `${140 + i * 80}ms`,
              }}
              onMouseEnter={(e) => {
                if (!brand.comingSoon) {
                  e.currentTarget.style.boxShadow = `0 8px 24px ${brand.color}15`
                }
              }}
              onMouseLeave={(e) => {
                if (!brand.comingSoon) {
                  e.currentTarget.style.boxShadow = brand.featured
                    ? '0 4px 16px rgba(124,58,237,0.08)'
                    : '0 2px 8px rgba(0,0,0,0.04)'
                }
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: brand.bgLight, color: brand.color }}
                >
                  {brand.icon}
                </div>
                {brand.comingSoon ? (
                  <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full mt-1">
                    Soon
                  </span>
                ) : (
                  <ArrowUpRight
                    size={14}
                    className="text-slate-300 group-hover:text-slate-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 mt-1"
                  />
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-0.5">{brand.name}</h3>
              <p
                className="text-[11px] text-slate-400 mb-1"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {brand.description}
              </p>
              <p className="text-[10px] text-slate-300">{brand.tagline}</p>
            </Tag>
          )
        })}
      </div>
    </section>
  )
}
