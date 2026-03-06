import { useState } from 'react'
import { Code2, Check, Copy, ArrowRight, Globe, Shield, Languages } from 'lucide-react'

const CURL_EXAMPLE = `curl -X POST https://ultralab.tw/api/v1/probe \\
  -H "Authorization: Bearer up_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "scan-prompt",
    "prompt": "You are a helpful assistant...",
    "language": "en"
  }'`

const RESPONSE_EXAMPLE = `{
  "ok": true,
  "analysis": {
    "grade": "D",
    "score": 42,
    "summary": "Multiple injection vectors detected",
    "vulnerabilities": [
      {
        "id": "role-escape",
        "severity": "HIGH",
        "finding": "No role boundary defined"
      }
    ]
  },
  "usage": { "current": 5, "limit": 100 }
}`

const FEATURES = [
  {
    icon: Globe,
    title: 'RESTful JSON API',
    desc: '即時回傳結構化漏洞報告',
  },
  {
    icon: Shield,
    title: '12 攻擊向量 + 20 Chatbot 偵測',
    desc: '覆蓋 OWASP LLM Top 10',
  },
  {
    icon: Languages,
    title: '雙語支援',
    desc: 'English / 繁體中文',
  },
]

export default function DeveloperSection() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CURL_EXAMPLE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }

  return (
    <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Content */}
          <div>
            <div className="terminal-tag-probe mb-6 w-fit">
              ultraprobe --docs
            </div>

            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              5 行程式碼
              <br />
              <span className="text-gradient-probe">掃描你的 AI</span>
            </h2>

            <p className="text-lg text-slate-400 mb-8">
              用 UltraProbe API 將 AI 安全掃描整合到你的 CI/CD、
              測試流程、或任何自動化工具中。
            </p>

            {/* Feature bullets */}
            <div className="space-y-4 mb-8">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    <feature.icon size={16} style={{ color: '#3B82F6' }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{feature.title}</div>
                    <div className="text-xs text-slate-500">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="/api/v1/probe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border transition-all duration-300 hover:scale-[1.02]"
              style={{
                borderColor: 'rgba(59,130,246,0.3)',
                background: 'rgba(59,130,246,0.08)',
                color: '#3B82F6',
              }}
            >
              查看完整 API 文檔
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Right: Code Block */}
          <div className="space-y-4">
            {/* Request */}
            <div className="card-probe !p-0 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: 'rgba(59,130,246,0.12)' }}
              >
                <div className="flex items-center gap-2">
                  <Code2 size={14} style={{ color: '#3B82F6' }} />
                  <span
                    className="text-xs font-bold"
                    style={{ color: '#3B82F6', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Request
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
                  style={{
                    color: copied ? '#10B981' : 'rgba(148,163,184,0.6)',
                    background: copied ? 'rgba(16,185,129,0.1)' : 'transparent',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre
                className="p-4 text-xs leading-relaxed overflow-x-auto"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#94A3B8',
                }}
              >
                <code>{CURL_EXAMPLE}</code>
              </pre>
            </div>

            {/* Response */}
            <div className="card-probe !p-0 overflow-hidden">
              <div
                className="flex items-center gap-2 px-4 py-2.5 border-b"
                style={{ borderColor: 'rgba(59,130,246,0.12)' }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#10B981' }}
                />
                <span
                  className="text-xs font-bold"
                  style={{ color: '#10B981', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Response — 200 OK
                </span>
              </div>
              <pre
                className="p-4 text-xs leading-relaxed overflow-x-auto"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#64748B',
                }}
              >
                <code>{RESPONSE_EXAMPLE}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
