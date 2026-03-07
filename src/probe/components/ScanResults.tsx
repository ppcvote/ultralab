import { useState } from 'react'
import { ArrowRight, ExternalLink, Sparkles, Shield, MessageCircle, Zap } from 'lucide-react'
import type { SecurityScanResult, ChatbotDetection, AIIntegrationPotential, DeterministicResult } from '../lib/probe-types'
import RiskGrade from './RiskGrade'
import VulnerabilityList from './VulnerabilityList'
import EmailGate from './EmailGate'

interface Props {
  result: SecurityScanResult
}

const FREE_VULN_LIMIT = 3

function DetectionList({ detections }: { detections: ChatbotDetection[] }) {
  if (detections.length === 0) return null

  return (
    <div className="mb-8">
      <h3
        className="text-xs text-slate-500 uppercase tracking-wider mb-3"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        偵測到的技術
      </h3>
      <div className="flex flex-wrap gap-2">
        {detections.map((d, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{
              color: d.type === 'ai-widget' ? '#FF3A3A' : '#3B82F6',
              borderColor: d.type === 'ai-widget' ? 'rgba(255,58,58,0.3)' : 'rgba(59,130,246,0.3)',
              background: d.type === 'ai-widget' ? 'rgba(255,58,58,0.05)' : 'rgba(59,130,246,0.05)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {d.name}
            <span className="text-slate-600">({d.confidence})</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function TechBadges({ techs }: { techs?: string[] }) {
  if (!techs || techs.length === 0) return null

  return (
    <div className="mb-8">
      <h3
        className="text-xs text-slate-500 uppercase tracking-wider mb-3"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        偵測到的技術棧
      </h3>
      <div className="flex flex-wrap gap-2">
        {techs.map((tech, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{
              color: '#14B8A6',
              borderColor: 'rgba(20,184,166,0.3)',
              background: 'rgba(20,184,166,0.05)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  )
}

function AIIntegrationSection({
  potential,
  considerations
}: {
  potential?: AIIntegrationPotential
  considerations?: string[]
}) {
  if (!potential && (!considerations || considerations.length === 0)) return null

  const priorityColor = potential?.implementationPriority === 'HIGH' ? '#10B981'
    : potential?.implementationPriority === 'MEDIUM' ? '#F59E0B'
    : '#3B82F6'

  return (
    <div className="mt-8 space-y-4">
      {potential && (
        <div className="card-probe !border-[rgba(138,92,255,0.2)]" style={{ background: 'rgba(138,92,255,0.03)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color: '#8A5CFF' }} />
            <h4
              className="text-xs text-[#8A5CFF] uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              AI 整合潛力分析
            </h4>
            <span
              className="ml-auto text-xs font-bold px-2 py-0.5 rounded"
              style={{
                color: priorityColor,
                background: `${priorityColor}15`,
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {potential.implementationPriority}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">適合的 AI 功能</p>
              <ul className="space-y-1">
                {potential.suitableFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-[#8A5CFF] mt-0.5">•</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">商業價值</p>
              <p className="text-sm text-slate-300">{potential.businessValue}</p>
            </div>
          </div>
        </div>
      )}

      {considerations && considerations.length > 0 && (
        <div className="card-probe !border-[rgba(59,130,246,0.2)]" style={{ background: 'rgba(59,130,246,0.03)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} style={{ color: '#3B82F6' }} />
            <h4
              className="text-xs text-[#3B82F6] uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              安全考量
            </h4>
          </div>
          <ul className="space-y-2">
            {considerations.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="text-[#3B82F6] mt-0.5">!</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PositivesList({ positives }: { positives: string[] }) {
  if (!positives || positives.length === 0) return null

  return (
    <div className="mt-6 card-probe !border-[rgba(16,185,129,0.2)]" style={{ background: 'rgba(16,185,129,0.03)' }}>
      <h4
        className="text-xs text-[#10B981] uppercase tracking-wider mb-3"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        正面發現
      </h4>
      <ul className="space-y-2">
        {positives.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
            <span className="text-[#10B981] mt-0.5">+</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeterministicSummary({ data }: { data: DeterministicResult }) {
  const defended = data.checks.filter(c => c.defended).length
  const total = data.checks.length
  const pct = Math.round((defended / total) * 100)

  return (
    <div className="mb-8 card-probe !border-[rgba(59,130,246,0.2)]" style={{ background: 'rgba(59,130,246,0.03)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} style={{ color: '#3B82F6' }} />
        <h4
          className="text-xs uppercase tracking-wider"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: '#3B82F6' }}
        >
          確定性分析（可重現）
        </h4>
        <span
          className="ml-auto text-xs font-bold px-2 py-0.5 rounded"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#FF3A3A',
            background: pct >= 70 ? 'rgba(16,185,129,0.1)' : pct >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(255,58,58,0.1)',
          }}
        >
          {data.coverage}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[rgba(59,130,246,0.1)] mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#FF3A3A',
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {data.checks.map(check => (
          <div key={check.id} className="flex items-center gap-1.5 text-xs">
            <span style={{ color: check.defended ? '#10B981' : '#FF3A3A' }}>
              {check.defended ? '●' : '○'}
            </span>
            <span className={check.defended ? 'text-slate-400' : 'text-slate-300'}>
              {check.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ScanResults({ result }: Props) {
  const [unlocked, setUnlocked] = useState(false)

  const analysis = result.data.analysis
  const deterministic = result.type === 'prompt' ? result.data.deterministic : undefined
  const vulns = analysis.vulnerabilities || []
  const hasGatedContent = vulns.length > FREE_VULN_LIMIT

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Divider */}
      <div className="flex items-center gap-4 mb-10">
        <div className="flex-1 h-px bg-[rgba(59,130,246,0.15)]" />
        <span className="text-xs text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          掃描報告
        </span>
        <div className="flex-1 h-px bg-[rgba(59,130,246,0.15)]" />
      </div>

      {/* URL detections */}
      {result.type === 'url' && (
        <DetectionList detections={result.data.detections} />
      )}

      {/* Tech stack badges (for N/A cases) */}
      {analysis.detectedTech && (
        <TechBadges techs={analysis.detectedTech} />
      )}

      {/* Risk Grade */}
      <div className="mb-10">
        <RiskGrade
          grade={analysis.grade}
          score={analysis.score}
          summary={analysis.summary}
        />
      </div>

      {/* Deterministic Scan Summary */}
      {deterministic && <DeterministicSummary data={deterministic} />}

      {/* AI Integration Potential (for N/A cases) */}
      {(analysis.aiIntegrationPotential || analysis.securityConsiderations) && (
        <AIIntegrationSection
          potential={analysis.aiIntegrationPotential}
          considerations={analysis.securityConsiderations}
        />
      )}

      {/* Vulnerabilities */}
      {vulns.length > 0 && (
        <div>
          <h3
            className="text-xs text-slate-500 uppercase tracking-wider mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            漏洞分析 ({vulns.length})
          </h3>
          <VulnerabilityList
            vulnerabilities={vulns}
            freeLimit={FREE_VULN_LIMIT}
            unlocked={unlocked}
          />

          {/* Email gate */}
          {hasGatedContent && !unlocked && (
            <EmailGate
              totalVulns={vulns.length}
              freeLimit={FREE_VULN_LIMIT}
              scanType={result.type}
              onUnlock={() => setUnlocked(true)}
            />
          )}
        </div>
      )}

      {/* Positives */}
      {unlocked && <PositivesList positives={analysis.positives} />}

      {/* Overall recommendation */}
      {(unlocked || !hasGatedContent) && analysis.overallRecommendation && (
        <div className="mt-6 card-probe !border-[rgba(255,58,58,0.2)]" style={{ background: 'rgba(255,58,58,0.03)' }}>
          <h4
            className="text-xs text-[#FF3A3A] uppercase tracking-wider mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            最優先修復
          </h4>
          <p className="text-sm text-slate-300">{analysis.overallRecommendation}</p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 text-center">
        <div className="card-probe text-center py-8">
          <h3 className="text-lg font-bold text-white mb-2">
            需要協助修復？
          </h3>
          <p className="text-sm text-slate-400 mb-5">
            Ultra Lab 提供 AI 資安防護服務 — 滲透測試 + 防禦建置 + 安全報告
          </p>
          <a
            href="/#contact"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #DC2626, #3B82F6)',
              boxShadow: '0 0 20px rgba(255,58,58,0.3)',
            }}
          >
            聯繫 Ultra Lab
            <ArrowRight size={14} />
          </a>
          <a
            href="/"
            className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            了解更多服務 <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Discord Community CTA */}
      <div className="mt-6 text-center">
        <a
          href="https://discord.gg/ewS4rWXvWk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 hover:-translate-y-0.5"
          style={{
            color: '#8A5CFF',
            border: '1px solid rgba(138,92,255,0.3)',
            background: 'rgba(138,92,255,0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(138,92,255,0.15)'
            e.currentTarget.style.borderColor = '#8A5CFF'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(138,92,255,0.05)'
            e.currentTarget.style.borderColor = 'rgba(138,92,255,0.3)'
          }}
        >
          <MessageCircle size={14} />
          加入 Discord 社群 — 更多即時安全報告
          <ExternalLink size={10} />
        </a>
      </div>
    </section>
  )
}
