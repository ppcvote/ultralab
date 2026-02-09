import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { trackCTAClick } from '../lib/analytics'

const navLinks = [
  { label: '服務項目', href: '#services' },
  { label: '作品展示', href: '#portfolio' },
  { label: '報價', href: '#pricing' },
  { label: '常見問題', href: '#faq' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = () => {
    setIsMobileOpen(false)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0A0515]/80 backdrop-blur-xl border-b border-[rgba(138,92,255,0.1)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <svg viewBox="0 0 320 420" className="w-6 h-8 lg:w-7 lg:h-9">
              <defs>
                <linearGradient id="nav-gp" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#CE4DFF" />
                  <stop offset="100%" stopColor="#8A5CFF" />
                </linearGradient>
                <linearGradient id="nav-gt" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#14B8A6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <path fill="none" stroke="url(#nav-gp)" strokeWidth="18" strokeLinecap="round" d="M 90,40 C 90,160 130,220 242,380" />
              <path fill="none" stroke="url(#nav-gt)" strokeWidth="18" strokeLinecap="round" d="M 230,40 C 230,160 190,220 78,380" />
              <path fill="none" stroke="#E8E0FF" strokeWidth="12" strokeLinecap="round" opacity="0.6" d="M 91.5,314 L 228.5,314" />
            </svg>
            <span
              className="text-xl lg:text-2xl font-[800] tracking-tight text-gradient-purple"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              ULTRA LAB
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-400 hover:text-white transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => trackCTAClick('立即諮詢-navbar')}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
                boxShadow: '0 0 20px rgba(138, 92, 255, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(138, 92, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(138, 92, 255, 0.3)'
              }}
            >
              立即諮詢
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-[#0A0515]/95 backdrop-blur-xl border-b border-[rgba(138,92,255,0.1)] animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className="block py-2 text-slate-400 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => { handleNavClick(); trackCTAClick('立即諮詢-mobile') }}
              className="block text-center px-5 py-3 text-sm font-semibold text-white rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
              }}
            >
              立即諮詢
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
