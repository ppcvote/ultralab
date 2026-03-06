import { ArrowUpRight } from 'lucide-react'

const footerLinks = [
  { label: '服務項目', href: '#services' },
  { label: '作品展示', href: '#portfolio' },
  { label: '報價', href: '#pricing' },
  { label: '常見問題', href: '#faq' },
  { label: '聯繫我們', href: '#contact' },
]

const socialLinks = [
  {
    label: 'Discord',
    href: 'https://discord.gg/ewS4rWXvWk',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
  {
    label: 'Threads',
    href: 'https://www.threads.net/@ultralab.tw',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.22 1.332-2.96.834-.668 1.98-1.05 3.234-1.143.755-.056 1.527-.036 2.299-.017l.135.003c.353.009.705.017 1.056.017-.003-.157-.01-.312-.023-.466-.169-2.073-1.11-3.134-2.797-3.153-1.15.01-2.074.512-2.745 1.49l-1.71-1.09c.982-1.428 2.417-2.183 4.27-2.248l.087-.002c2.665 0 4.397 1.56 4.666 4.19.043.414.063.84.063 1.272 0 .103-.001.206-.004.31 1.067.594 1.9 1.424 2.428 2.454.855 1.666.96 4.453-1.165 6.542-1.796 1.763-4.027 2.548-7.234 2.573zM13.6 14.002c-.493 0-.987.012-1.478.036-.907.067-1.61.313-2.087.73-.396.346-.584.763-.558 1.236.04.735.387 1.262 1.032 1.567.585.277 1.332.377 2.1.338 1.07-.058 1.895-.44 2.449-1.13.38-.474.66-1.107.834-1.89a17.093 17.093 0 00-2.292-.887z"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/ultralab.tw',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer role="contentinfo" className="relative border-t border-[rgba(138,92,255,0.06)] bg-[#0A0515]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <svg viewBox="0 0 320 420" className="w-5 h-7">
                <defs>
                  <linearGradient id="ft-gp" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#CE4DFF" />
                    <stop offset="100%" stopColor="#8A5CFF" />
                  </linearGradient>
                  <linearGradient id="ft-gt" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <path fill="none" stroke="url(#ft-gp)" strokeWidth="18" strokeLinecap="round" d="M 90,40 C 90,160 130,220 242,380" />
                <path fill="none" stroke="url(#ft-gt)" strokeWidth="18" strokeLinecap="round" d="M 230,40 C 230,160 190,220 78,380" />
                <path fill="none" stroke="#E8E0FF" strokeWidth="12" strokeLinecap="round" opacity="0.6" d="M 91.5,314 L 228.5,314" />
              </svg>
              <span className="text-lg font-[800] tracking-tight text-gradient-purple">
                ULTRA LAB
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              傲創實業旗下 AI 技術品牌。LLM 驅動的全自動化引擎 — 從 AI 內容生成、社群自動化到 SaaS 產品化。
            </p>
          </div>

          {/* Links */}
          <div>
            <h4
              className="text-xs text-slate-500 uppercase tracking-wider mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              快速連結
            </h4>
            <nav className="space-y-2">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors group"
                >
                  {link.label}
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </nav>
          </div>

          {/* Contact & Social */}
          <div>
            <h4
              className="text-xs text-slate-500 uppercase tracking-wider mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              聯繫方式
            </h4>
            <a
              href="mailto:contact@ultralab.tw"
              className="text-sm text-slate-400 hover:text-white transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              contact@ultralab.tw
            </a>
            <div className="flex items-center gap-3 mt-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#CE4DFF] hover:bg-[rgba(138,92,255,0.08)] transition-all"
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-[rgba(138,92,255,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            &copy; 2026 Ultra Lab &middot; 傲創實業有限公司
          </div>
          <div
            className="text-xs text-slate-700"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Powered by Ultra Creation
          </div>
        </div>
      </div>
    </footer>
  )
}
