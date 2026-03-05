import { useState, useCallback } from 'react'
import type { ScanMode, ScanState, ScanResult, ScanError, RivalNeedsInput } from '../lib/probe-types'

interface UseProbeScanReturn {
  scan: (input: string, manualContent?: string) => Promise<void>
  result: ScanResult | null
  scanState: ScanState
  error: string | null
  remaining: number | null
  needsManualInput: boolean
  partialContent: string
}

export function useProbeScan(mode: ScanMode): UseProbeScanReturn {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [needsManualInput, setNeedsManualInput] = useState(false)
  const [partialContent, setPartialContent] = useState('')

  const scan = useCallback(async (input: string, manualContent?: string) => {
    setScanState('scanning')
    setError(null)
    setResult(null)
    setNeedsManualInput(false)

    let endpoint: string
    let body: Record<string, string>

    if (mode === 'prompt') {
      endpoint = '/api/probe-scan-prompt'
      body = { prompt: input }
    } else if (mode === 'url') {
      endpoint = '/api/probe-scan-url'
      body = { url: input }
    } else {
      endpoint = '/api/probe-rival'
      body = manualContent
        ? { url: input, manualContent }
        : { url: input }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const remainingHeader = res.headers.get('X-RateLimit-Remaining')
      if (remainingHeader !== null) setRemaining(parseInt(remainingHeader, 10))

      const data = await res.json()

      if (!res.ok) {
        const errData = data as ScanError
        setError(errData.error || '分析失敗')
        setScanState('error')
        return
      }

      // Handle rival mode's manual input fallback
      if (mode === 'rival' && data.needsManualInput) {
        const rivalData = data as RivalNeedsInput
        setNeedsManualInput(true)
        setPartialContent(rivalData.partialContent || '')
        setScanState('idle')
        return
      }

      setResult({ type: mode, data } as ScanResult)
      setScanState('done')
    } catch {
      setError('網路錯誤，請檢查連線後再試。')
      setScanState('error')
    }
  }, [mode])

  return { scan, result, scanState, error, remaining, needsManualInput, partialContent }
}
