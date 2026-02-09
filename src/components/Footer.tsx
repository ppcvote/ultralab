export default function Footer() {
  return (
    <footer className="border-t border-[rgba(138,92,255,0.1)] bg-[#0A0515]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left — Copyright */}
          <div className="text-sm text-slate-500">
            &copy; 2026 Ultra Lab &middot; 傲創實業股份有限公司
          </div>

          {/* Center — Links */}
          <div className="flex items-center gap-6 text-sm">
            <a href="#services" className="text-slate-500 hover:text-slate-300 transition-colors">
              服務項目
            </a>
            <a href="#pricing" className="text-slate-500 hover:text-slate-300 transition-colors">
              報價
            </a>
            <a href="#faq" className="text-slate-500 hover:text-slate-300 transition-colors">
              常見問題
            </a>
          </div>

          {/* Right — Social + Powered by */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.threads.net/@ultralab.tw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-[#CE4DFF] transition-colors"
              aria-label="Threads"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.22 1.332-2.96.834-.668 1.98-1.05 3.234-1.143.755-.056 1.527-.036 2.299-.017l.135.003c.353.009.705.017 1.056.017-.003-.157-.01-.312-.023-.466-.169-2.073-1.11-3.134-2.797-3.153-1.15.01-2.074.512-2.745 1.49l-1.71-1.09c.982-1.428 2.417-2.183 4.27-2.248l.087-.002c2.665 0 4.397 1.56 4.666 4.19.043.414.063.84.063 1.272 0 .103-.001.206-.004.31 1.067.594 1.9 1.424 2.428 2.454.855 1.666.96 4.453-1.165 6.542-1.796 1.763-4.027 2.548-7.234 2.573zM13.6 14.002c-.493 0-.987.012-1.478.036-.907.067-1.61.313-2.087.73-.396.346-.584.763-.558 1.236.04.735.387 1.262 1.032 1.567.585.277 1.332.377 2.1.338 1.07-.058 1.895-.44 2.449-1.13.38-.474.66-1.107.834-1.89a17.093 17.093 0 00-2.292-.887z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/ultralab.tw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-[#CE4DFF] transition-colors"
              aria-label="Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <span
              className="text-sm text-slate-600"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Powered by Ultra Creation
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
