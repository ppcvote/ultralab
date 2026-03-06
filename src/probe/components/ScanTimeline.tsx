import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface TimelineStep {
  id: string
  label: string
  duration: number // ms
}

const SCAN_STEPS: TimelineStep[] = [
  { id: 'fetch', label: '正在抓取目標...', duration: 1200 },
  { id: 'parse', label: '正在解析 HTML...', duration: 800 },
  { id: 'detect', label: '正在偵測技術棧...', duration: 1000 },
  { id: 'analyze', label: '正在分析風險...', duration: 2000 },
  { id: 'report', label: '正在生成報告...', duration: 1500 },
]

export default function ScanTimeline() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (currentStep >= SCAN_STEPS.length) return

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, SCAN_STEPS.length))
    }, SCAN_STEPS[currentStep].duration)

    return () => clearTimeout(timer)
  }, [currentStep])

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="card-probe">
        <div className="space-y-3">
          {SCAN_STEPS.map((step, index) => {
            const isComplete = index < currentStep
            const isCurrent = index === currentStep
            const isPending = index > currentStep

            return (
              <div
                key={step.id}
                className="flex items-center gap-3 transition-all duration-300"
                style={{
                  opacity: isPending ? 0.4 : 1,
                }}
              >
                {/* Icon */}
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isComplete
                      ? 'rgba(16,185,129,0.2)'
                      : isCurrent
                      ? 'rgba(59,130,246,0.2)'
                      : 'rgba(100,116,139,0.2)',
                    border: isComplete
                      ? '1px solid rgba(16,185,129,0.5)'
                      : isCurrent
                      ? '1px solid rgba(59,130,246,0.5)'
                      : '1px solid rgba(100,116,139,0.3)',
                  }}
                >
                  {isComplete ? (
                    <Check size={12} style={{ color: '#10B981' }} />
                  ) : isCurrent ? (
                    <Loader2 size={12} style={{ color: '#3B82F6' }} className="animate-spin" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  )}
                </div>

                {/* Label */}
                <span
                  className="text-sm transition-all duration-300"
                  style={{
                    color: isComplete ? '#10B981' : isCurrent ? '#3B82F6' : '#64748B',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {step.label}
                </span>

                {/* Progress bar for current step */}
                {isCurrent && (
                  <div className="flex-1 h-1 rounded-full overflow-hidden bg-[rgba(59,130,246,0.1)]">
                    <div
                      className="h-full bg-[#3B82F6] animate-scan-progress"
                      style={{
                        animationDuration: `${step.duration}ms`,
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Scanning text */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          掃描中，請稍候...
        </p>
      </div>
    </div>
  )
}
