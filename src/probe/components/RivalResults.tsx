import { useState } from 'react'
import { User, BarChart3, MessageCircle, Share2, Crosshair, Sparkles, Check, Copy } from 'lucide-react'
import type { RivalAnalysis } from '../lib/probe-types'

interface Props {
  analysis: RivalAnalysis
}

function CopyBlock({ label, content }: { label: string; content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-xl border border-[rgba(138,92,255,0.15)] bg-[rgba(10,10,18,0.6)] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#8A5CFF] font-semibold uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {label}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all hover:bg-[rgba(138,92,255,0.1)]"
          style={{ color: copied ? '#10B981' : '#8A5CFF', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '已複製' : '複製'}
        </button>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}

function ThemeBar({ topic, percentage, maxPercentage }: { topic: string; percentage: number; maxPercentage: number }) {
  const width = Math.max((percentage / maxPercentage) * 100, 8)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-24 shrink-0 truncate" title={topic}>{topic}</span>
      <div className="flex-1 h-5 rounded-md bg-[rgba(138,92,255,0.06)] overflow-hidden">
        <div
          className="h-full rounded-md transition-all duration-700"
          style={{
            width: `${width}%`,
            background: 'linear-gradient(90deg, #8A5CFF, #CE4DFF)',
          }}
        />
      </div>
      <span className="text-xs text-slate-500 w-10 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {percentage}%
      </span>
    </div>
  )
}

export default function RivalResults({ analysis }: Props) {
  const { profileSummary, contentStrategy, engagementPatterns, trafficSources, competitiveInsights, promptSuggestions } = analysis
  const maxThemePercentage = Math.max(...(contentStrategy.themes?.map(t => t.percentage) || [50]), 1)

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Profile Summary */}
      <div className="card-probe !border-[rgba(138,92,255,0.25)] mb-8" style={{ background: 'linear-gradient(135deg, rgba(138,92,255,0.06), rgba(206,77,255,0.03))' }}>
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(138,92,255,0.2), rgba(206,77,255,0.15))', border: '1px solid rgba(138,92,255,0.3)' }}
          >
            <User size={20} className="text-[#CE4DFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">{profileSummary.handle}</h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: 'rgba(138,92,255,0.12)',
                  color: '#CE4DFF',
                  border: '1px solid rgba(138,92,255,0.25)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {profileSummary.platform}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{profileSummary.bio}</p>
            <p className="text-xs text-slate-600 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {profileSummary.contentVolume}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Strategy */}
        <div className="card-probe !border-[rgba(138,92,255,0.15)]">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} className="text-[#8A5CFF]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              內容策略
            </h3>
          </div>

          {/* Theme bars */}
          <div className="space-y-2.5 mb-5">
            {contentStrategy.themes?.map((t, i) => (
              <ThemeBar key={i} topic={t.topic} percentage={t.percentage} maxPercentage={maxThemePercentage} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-[rgba(138,92,255,0.06)] p-3">
              <span className="text-slate-500 block mb-1">發文頻率</span>
              <span className="text-slate-300">{contentStrategy.postingFrequency}</span>
            </div>
            <div className="rounded-lg bg-[rgba(138,92,255,0.06)] p-3">
              <span className="text-slate-500 block mb-1">最佳類型</span>
              <span className="text-slate-300">{contentStrategy.bestPerformingType}</span>
            </div>
          </div>

          {contentStrategy.formats?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {contentStrategy.formats.map((f, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] text-slate-400 border border-[rgba(138,92,255,0.12)]">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Engagement Patterns */}
        <div className="card-probe !border-[rgba(138,92,255,0.15)]">
          <div className="flex items-center gap-2 mb-5">
            <MessageCircle size={16} className="text-[#8A5CFF]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              互動模式
            </h3>
          </div>

          <div className="mb-4">
            <span className="text-[10px] text-[#8A5CFF] uppercase tracking-wider font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Hook 句型
            </span>
            <div className="mt-2 space-y-2">
              {engagementPatterns.hookPatterns?.map((h, i) => (
                <div key={i} className="pl-3 border-l-2 border-[rgba(138,92,255,0.3)] text-sm text-slate-300">
                  {h}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <span className="text-[10px] text-[#8A5CFF] uppercase tracking-wider font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              CTA 句型
            </span>
            <div className="mt-2 space-y-2">
              {engagementPatterns.ctaPatterns?.map((c, i) => (
                <div key={i} className="pl-3 border-l-2 border-[rgba(206,77,255,0.3)] text-sm text-slate-300">
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[rgba(138,92,255,0.06)] p-3 text-xs">
            <span className="text-slate-500 block mb-1">互動風格</span>
            <span className="text-slate-300">{engagementPatterns.interactionStyle}</span>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="card-probe !border-[rgba(138,92,255,0.15)]">
          <div className="flex items-center gap-2 mb-5">
            <Share2 size={16} className="text-[#8A5CFF]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              流量來源
            </h3>
          </div>

          <div className="rounded-lg bg-[rgba(138,92,255,0.06)] p-3 text-sm text-slate-300 mb-4">
            {trafficSources.hashtagStrategy}
          </div>

          {trafficSources.seoKeywords?.length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                SEO 關鍵字
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {trafficSources.seoKeywords.map((k, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: 'rgba(138,92,255,0.08)',
                      color: '#CE4DFF',
                      border: '1px solid rgba(138,92,255,0.2)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {trafficSources.crossPlatformLinks?.length > 0 && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                跨平台連結
              </span>
              <div className="mt-2 space-y-1">
                {trafficSources.crossPlatformLinks.map((l, i) => (
                  <div key={i} className="text-xs text-slate-400 truncate">{l}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Competitive Insights */}
        <div className="card-probe !border-[rgba(138,92,255,0.15)]">
          <div className="flex items-center gap-2 mb-5">
            <Crosshair size={16} className="text-[#8A5CFF]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              競爭洞察
            </h3>
          </div>

          <div className="space-y-4">
            {/* Strengths */}
            <div>
              <span className="text-[10px] text-[#10B981] uppercase tracking-wider font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                對手強項
              </span>
              <div className="mt-2 space-y-1.5">
                {competitiveInsights.strengths?.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-[#10B981] mt-0.5 shrink-0">+</span>
                    <span className="text-slate-300">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div>
              <span className="text-[10px] text-[#F59E0B] uppercase tracking-wider font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                對手弱點
              </span>
              <div className="mt-2 space-y-1.5">
                {competitiveInsights.weaknesses?.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-[#F59E0B] mt-0.5 shrink-0">-</span>
                    <span className="text-slate-300">{w}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div>
              <span className="text-[10px] text-[#CE4DFF] uppercase tracking-wider font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                你的機會
              </span>
              <div className="mt-2 space-y-1.5">
                {competitiveInsights.opportunities?.map((o, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-[#CE4DFF] mt-0.5 shrink-0">*</span>
                    <span className="text-slate-300">{o}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Suggestions — full width */}
      <div className="mt-6 card-probe !border-[rgba(138,92,255,0.25)]" style={{ background: 'linear-gradient(135deg, rgba(138,92,255,0.06), rgba(206,77,255,0.03))' }}>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={16} className="text-[#CE4DFF]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            AI Prompt 建議
          </h3>
          <span className="text-[10px] text-slate-500 ml-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            可直接複製使用
          </span>
        </div>

        <div className="space-y-4">
          <CopyBlock label="內容創作 Prompt" content={promptSuggestions.contentPrompt} />
          <CopyBlock label="Hook 開頭 Prompt" content={promptSuggestions.hookPrompt} />
          <CopyBlock label="互動引導 Prompt" content={promptSuggestions.engagementPrompt} />
        </div>
      </div>
    </section>
  )
}
