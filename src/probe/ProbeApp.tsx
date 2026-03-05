import { useState, useEffect } from 'react'
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
import LiveStatsSection from './components/LiveStatsSection'
import EnterpriseCTA from './components/EnterpriseCTA'
import ProbeFooter from './components/ProbeFooter'
import './probe.css'

function useProbeMeta() {
  useEffect(() => {
    document.title = 'UltraProbe — 全球首個免費 AI 安全掃描平台 | Ultra Lab'

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', '免費掃描你的 AI 系統，偵測 Prompt Injection 漏洞。Ultra Lab 專業團隊打造，涵蓋 OWASP LLM Top 10 攻擊向量。')
    }

    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', '#0A0A12')
  }, [])
}

export default function ProbeApp() {
  useProbeMeta()
  const [scanMode, setScanMode] = useState<ScanMode>('prompt')

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

        {showResults && activeScan.result && (
          activeScan.result.type === 'rival'
            ? <RivalResults analysis={activeScan.result.data.analysis} />
            : <ScanResults result={activeScan.result} />
        )}

        {(showLandingPage || showResults) && <ExpertiseSection />}

        {showLandingPage && <LiveStatsSection />}

        <EnterpriseCTA />
      </main>

      <ProbeFooter />
    </div>
  )
}
