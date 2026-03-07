import { useState, useEffect, useRef } from 'react'
import type { ScanMode } from './lib/probe-types'
import { useProbeScan } from './hooks/useProbeScan'
import ProbeNavbar from './components/ProbeNavbar'
import ProbeHero from './components/ProbeHero'
import ProblemSection from './components/ProblemSection'
import PromptScanForm from './components/PromptScanForm'
import UrlScanForm from './components/UrlScanForm'
import RivalForm from './components/RivalForm'
import ScanTimeline from './components/ScanTimeline'
import ScanResults from './components/ScanResults'
import RivalResults from './components/RivalResults'
import ExpertiseSection from './components/ExpertiseSection'
import ApiPricingSection from './components/ApiPricingSection'
import DeveloperSection from './components/DeveloperSection'
import LiveStatsSection from './components/LiveStatsSection'
import EnterpriseCTA from './components/EnterpriseCTA'
import ProbeFooter from './components/ProbeFooter'
import './probe.css'

function useProbeMeta() {
  useEffect(() => {
    document.title = 'UltraProbe — 免費 AI Prompt Injection 掃描器 | Ultra Lab'

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', '免費掃描你的 AI 系統，偵測 Prompt Injection 漏洞。確定性規則引擎 + AI 深度分析，涵蓋 OWASP LLM Top 10 攻擊向量。')
    }

    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', '#0A0A12')
  }, [])
}

export default function ProbeApp() {
  useProbeMeta()
  const [scanMode, setScanMode] = useState<ScanMode>('prompt')
  const resultsRef = useRef<HTMLDivElement>(null)

  const promptScan = useProbeScan('prompt')
  const urlScan = useProbeScan('url')
  const rivalScan = useProbeScan('rival')

  const activeScan = scanMode === 'prompt' ? promptScan
    : scanMode === 'url' ? urlScan
    : rivalScan

  const handleModeChange = (mode: ScanMode) => {
    setScanMode(mode)
  }

  const showLandingPage = activeScan.scanState === 'idle' && !rivalScan.needsManualInput
  const showResults = activeScan.scanState === 'done' && activeScan.result !== null

  // Auto-scroll to results when scan completes
  useEffect(() => {
    if (showResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showResults])

  return (
    <div className="probe-app min-h-screen bg-probe-grid text-slate-50" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <ProbeNavbar />

      <main>
        <ProbeHero scanMode={scanMode} onModeChange={handleModeChange} />

        {showLandingPage && scanMode !== 'rival' && <ProblemSection />}

        <div id="scan-form">
          {scanMode === 'prompt' ? (
            <PromptScanForm
              onScan={promptScan.scan}
              scanState={promptScan.scanState}
              error={promptScan.error}
              remaining={promptScan.remaining}
              result={promptScan.result}
            />
          ) : scanMode === 'url' ? (
            <UrlScanForm
              onScan={urlScan.scan}
              scanState={urlScan.scanState}
              error={urlScan.error}
              remaining={urlScan.remaining}
              result={urlScan.result}
            />
          ) : (
            <RivalForm
              onScan={rivalScan.scan}
              scanState={rivalScan.scanState}
              error={rivalScan.error}
              remaining={rivalScan.remaining}
              result={rivalScan.result}
              needsManualInput={rivalScan.needsManualInput}
              partialContent={rivalScan.partialContent}
            />
          )}
        </div>

        {activeScan.scanState === 'scanning' && (
          <div className="py-16">
            <ScanTimeline />
          </div>
        )}

        <div ref={resultsRef}>
          {showResults && activeScan.result && (
            activeScan.result.type === 'rival'
              ? <RivalResults analysis={activeScan.result.data.analysis} />
              : <ScanResults result={activeScan.result} />
          )}
        </div>

        {(showLandingPage || showResults) && <ExpertiseSection />}

        {(showLandingPage || showResults) && <ApiPricingSection />}

        <div id="api-docs">
          {showLandingPage && <DeveloperSection />}
        </div>

        {showLandingPage && <LiveStatsSection />}

        <EnterpriseCTA />
      </main>

      <ProbeFooter />
    </div>
  )
}
