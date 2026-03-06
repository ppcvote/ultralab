export default function MinYiFooter() {
  return (
    <footer className="px-6 py-8 text-center">
      <div className="w-12 h-px mx-auto mb-6 bg-slate-200" />
      <p className="text-xs text-slate-400 mb-1">
        謝民義 | Ultra Creation Co., Ltd.
      </p>
      <p className="text-[10px] text-slate-300">
        &copy; {new Date().getFullYear()} All rights reserved.
      </p>
      <a
        href="https://ultralab.tw"
        className="inline-block mt-3 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        ultralab.tw
      </a>
    </footer>
  )
}
