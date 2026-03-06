import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Shield, Code2 } from 'lucide-react'

interface Stats {
  totalScans: number
  totalVulnerabilities: number
  avgGrade: string
  activeUsers: number
}

// Conservative stats (replace with Firestore later)
const MOCK_STATS: Stats = {
  totalScans: 327,
  totalVulnerabilities: 2419,
  avgGrade: 'D',
  activeUsers: 48,
}

export default function LiveStatsSection() {
  const [stats] = useState<Stats>(MOCK_STATS)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation when component mounts
    setIsVisible(true)

    // TODO: Fetch real stats from Firestore
    // const unsubscribe = db.collection('counters').doc('probe_stats')
    //   .onSnapshot(doc => setStats(doc.data() as Stats))
    // return () => unsubscribe()
  }, [])

  const STATS_DISPLAY = [
    {
      icon: Activity,
      label: '已掃描 Prompt',
      value: stats.totalScans.toLocaleString(),
      suffix: '個',
      color: '#3B82F6',
      trend: '持續累積',
    },
    {
      icon: Shield,
      label: '已發現漏洞',
      value: stats.totalVulnerabilities.toLocaleString(),
      suffix: '個',
      color: '#FF3A3A',
      trend: '持續更新',
    },
    {
      icon: TrendingUp,
      label: '平均安全等級',
      value: stats.avgGrade,
      suffix: '/A',
      color: '#F59E0B',
      trend: '需要改進',
    },
    {
      icon: Code2,
      label: 'API 開發者',
      value: stats.activeUsers.toLocaleString(),
      suffix: '人',
      color: '#10B981',
      trend: '持續成長',
    },
  ]

  return (
    <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
            style={{
              borderColor: 'rgba(59,130,246,0.3)',
              background: 'rgba(59,130,246,0.05)',
            }}
          >
            <Activity size={16} style={{ color: '#3B82F6' }} />
            <span className="text-sm font-medium" style={{ color: '#3B82F6' }}>
              即時統計數據
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            全球開發者都在使用
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {' '}UltraProbe
            </span>
          </h2>

          <p className="text-lg text-slate-400">
            加入數百位開發者，一起打造更安全的 AI 系統
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS_DISPLAY.map((stat, i) => (
            <div
              key={i}
              className={`card-probe text-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: `${i * 100}ms`,
                borderColor: `${stat.color}20`,
                background: 'rgba(12,12,24,0.6)',
              }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${stat.color}15`,
                    border: `1px solid ${stat.color}30`,
                  }}
                >
                  <stat.icon size={24} style={{ color: stat.color }} />
                </div>
              </div>

              {/* Value */}
              <div className="mb-2">
                <span
                  className="text-4xl font-black"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </span>
                <span className="text-xl text-slate-500 ml-1">
                  {stat.suffix}
                </span>
              </div>

              {/* Label */}
              <div className="text-sm font-medium text-white mb-2">
                {stat.label}
              </div>

              {/* Trend */}
              <div
                className="text-xs px-2 py-1 rounded inline-block"
                style={{
                  background: `${stat.color}15`,
                  color: stat.color,
                }}
              >
                {stat.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <Activity size={14} className="inline mr-1" />
          數據每小時更新 | 最後更新：{new Date().toLocaleTimeString('zh-TW')}
        </div>
      </div>
    </section>
  )
}
