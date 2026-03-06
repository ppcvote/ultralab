import type { Grade } from '../lib/probe-types'
import { GRADE_COLORS } from '../lib/probe-types'

interface Props {
  grade: Grade | 'N/A'
  score: number
  summary: string
}

const GRADE_LABELS: Record<string, string> = {
  A: '安全',
  B: '低風險',
  C: '中等風險',
  D: '高風險',
  E: '脆弱',
  F: '嚴重危險',
  'N/A': '不適用',
}

export default function RiskGrade({ grade, score, summary }: Props) {
  const color = grade === 'N/A' ? '#64748B' : GRADE_COLORS[grade]
  const label = GRADE_LABELS[grade] || ''
  const circumference = 2 * Math.PI * 50
  const offset = score >= 0 ? circumference - (score / 100) * circumference : circumference

  return (
    <div className="text-center">
      {/* SVG Circle */}
      <div className="relative inline-block w-40 h-40 sm:w-48 sm:h-48">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke="rgba(59,130,246,0.08)"
            strokeWidth="6"
          />
          {/* Score arc */}
          {score >= 0 && (
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                animation: 'score-fill 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                filter: `drop-shadow(0 0 8px ${color}60)`,
              }}
            />
          )}
        </svg>

        {/* Grade letter */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ animation: 'grade-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          <span
            className="text-4xl sm:text-5xl font-[900]"
            style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {grade}
          </span>
          {score >= 0 && (
            <span
              className="text-xs text-slate-500 mt-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {score}/100
            </span>
          )}
        </div>
      </div>

      {/* Label */}
      <div
        className="mt-4 text-xs font-bold tracking-[0.2em] uppercase"
        style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </div>

      {/* Summary */}
      <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
        {summary}
      </p>
    </div>
  )
}
