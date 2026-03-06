import { useState, useEffect } from 'react'
import { useInView } from '../hooks/useInView'
import { useLiveStats } from '../hooks/useLiveStats'

/* ── Fake Data ── */
const accounts = [
  { name: 'risk.clock.tw', followers: '1,312', status: 'active', growth: '+182' },
  { name: 'ginrollbt', followers: '6,521', status: 'active', growth: '+47' },
  { name: 'UltraAdvisor', followers: '843', status: 'active', growth: '+23' },
  { name: 'UltraLab', followers: '294', status: 'active', growth: '+18' },
  { name: 'retirement_diary', followers: '567', status: 'scheduled', growth: '+31' },
  { name: 'universe_signal', followers: '391', status: 'active', growth: '+12' },
]

const aiPosts = [
  { time: '09:00', account: 'risk.clock', content: '⚠️ 台灣 2026 通膨率突破 3.2%，實質薪資連續第 4 年負成長...', status: 'published' },
  { time: '10:30', account: 'ginrollbt', content: '📊 行銷漏斗拆解：從曝光到成交的 5 個關鍵數字，90% 的人卡在...', status: 'published' },
  { time: '12:00', account: 'UltraAdvisor', content: '💰 ETF 定期定額 vs 單筆投入：10 年回測數據告訴你真正答案...', status: 'queued' },
  { time: '13:30', account: 'UltraLab', content: '🤖 Gemini 2.5 Flash 實測：比 GPT-4o 快 3 倍，成本降 80%...', status: 'generating' },
  { time: '15:00', account: 'retirement', content: '🏠 55 歲提早退休需要多少錢？用 4% 法則算給你看...', status: 'queued' },
]

const weeklyData = [
  { day: 'Mon', posts: 35, engagement: 4.2 },
  { day: 'Tue', posts: 35, engagement: 5.1 },
  { day: 'Wed', posts: 33, engagement: 3.8 },
  { day: 'Thu', posts: 35, engagement: 6.3 },
  { day: 'Fri', posts: 34, engagement: 5.7 },
  { day: 'Sat', posts: 35, engagement: 7.2 },
  { day: 'Sun', posts: 35, engagement: 4.9 },
]

/* ── Typing indicator ── */
function TypingDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  )
}

/* ── Dashboard Mockup ── */
function DashboardMockup({ visible, stats }: { visible: boolean; stats: { totalPosts: number; totalFollowers: number } }) {
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics'>('posts')

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{
        background: 'rgba(8, 5, 18, 0.95)',
        border: '1px solid rgba(138, 92, 255, 0.15)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(138,92,255,0.06)',
      }}
    >
      {/* Title Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
        <span
          className="ml-2 text-[11px] text-slate-600"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Mind Threads — AI Content Engine
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-500/70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>6 accounts live</span>
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="flex" style={{ minHeight: '380px' }}>
        {/* Sidebar */}
        <div
          className="hidden sm:flex flex-col w-48 py-3 px-2 shrink-0"
          style={{ borderRight: '1px solid rgba(138,92,255,0.08)' }}
        >
          {/* Logo area */}
          <div className="flex items-center gap-2 px-3 py-2 mb-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #8A5CFF, #14B8A6)' }}>MT</div>
            <span className="text-xs font-semibold text-slate-300">Mind Threads</span>
          </div>

          {/* Nav items */}
          {[
            { label: 'Dashboard', active: true },
            { label: 'Accounts (6)', active: false },
            { label: 'AI Writer', active: false },
            { label: 'Scheduler', active: false },
            { label: 'Analytics', active: false },
          ].map((item) => (
            <div
              key={item.label}
              className="px-3 py-1.5 rounded-md text-[11px] mb-0.5"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: item.active ? 'rgba(138,92,255,0.12)' : 'transparent',
                color: item.active ? '#CE4DFF' : 'rgba(148,163,184,0.6)',
              }}
            >
              {item.label}
            </div>
          ))}

          {/* Account list */}
          <div className="mt-4 px-2">
            <div className="text-[9px] text-slate-700 uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Accounts</div>
            {accounts.slice(0, 4).map((a) => (
              <div key={a.name} className="flex items-center gap-1.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.status === 'active' ? '#10B981' : '#F59E0B' }} />
                <span className="text-[10px] text-slate-500 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>@{a.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-4 overflow-hidden">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Total Posts', value: stats.totalPosts.toLocaleString(), change: 'AI generated', color: '#10B981' },
              { label: 'Total Followers', value: stats.totalFollowers.toLocaleString(), change: 'growing', color: '#4DA3FF' },
              { label: 'Automation', value: '100%', change: 'zero humans', color: '#CE4DFF' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg px-3 py-2"
                style={{ background: 'rgba(15,10,30,0.8)', border: '1px solid rgba(138,92,255,0.08)' }}
              >
                <div className="text-[9px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.label}</div>
                <div className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
                <div className="text-[10px] font-medium" style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.change}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3" role="tablist" aria-label="Dashboard views">
            {(['posts', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`tabpanel-${tab}`}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1 rounded-md text-[11px] transition-all"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: activeTab === tab ? 'rgba(138,92,255,0.15)' : 'transparent',
                  color: activeTab === tab ? '#CE4DFF' : 'rgba(148,163,184,0.5)',
                  border: activeTab === tab ? '1px solid rgba(138,92,255,0.2)' : '1px solid transparent',
                }}
              >
                {tab === 'posts' ? 'AI Queue' : 'Weekly Stats'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'posts' ? (
            <div id="tabpanel-posts" role="tabpanel" className="space-y-1.5">
              {aiPosts.map((post, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(138,92,255,0.05)' }}
                >
                  <span className="text-[10px] text-slate-700 shrink-0 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {post.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>@{post.account}</span>
                      <span
                        className="text-[9px] px-1.5 py-px rounded"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          background: post.status === 'published' ? 'rgba(16,185,129,0.1)' : post.status === 'generating' ? 'rgba(138,92,255,0.1)' : 'rgba(245,158,11,0.1)',
                          color: post.status === 'published' ? '#10B981' : post.status === 'generating' ? '#CE4DFF' : '#F59E0B',
                        }}
                      >
                        {post.status === 'generating' ? (<>generating<TypingDots /></>) : post.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{post.content}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div id="tabpanel-analytics" role="tabpanel" className="space-y-3">
              {/* Mini bar chart */}
              <div className="flex items-end gap-1 h-20 px-1">
                {weeklyData.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${(d.engagement / 7.2) * 100}%`,
                        background: `linear-gradient(to top, rgba(138,92,255,0.6), rgba(206,77,255,${0.3 + d.engagement / 10}))`,
                      }}
                    />
                    <span className="text-[8px] text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.day}</span>
                  </div>
                ))}
              </div>
              {/* Weekly summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(138,92,255,0.05)' }}>
                  <div className="text-[9px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Weekly Posts</div>
                  <div className="text-sm font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>242</div>
                </div>
                <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(138,92,255,0.05)' }}>
                  <div className="text-[9px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Avg Engagement</div>
                  <div className="text-sm font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>5.3%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Live Counter ── */
function LiveCounter({ visible, baseCount }: { visible: boolean; baseCount: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setCount((c) => c + 1)
    }, 2400)
    return () => clearInterval(interval)
  }, [visible])

  return (
    <div className="flex items-center gap-3 justify-center mt-6" aria-live="polite" aria-atomic="true">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
      <span
        className="text-sm text-slate-500"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        AI 已自動產出第 <span className="text-green-400 font-bold">{(baseCount + count).toLocaleString()}</span> 篇內容...
      </span>
    </div>
  )
}

/* ── Product Showcase Section ── */
export default function ProductShowcase() {
  const { ref, isInView } = useInView({ threshold: 0.1 })
  const liveStats = useLiveStats()

  return (
    <section ref={ref} id="product-demo" className="relative py-24 lg:py-32 bg-lab overflow-hidden" aria-label="產品實機展示">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(138,92,255,0.08) 0%, transparent 60%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="terminal-tag mb-4">demo --live mind-threads</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-white mb-4">
            產品實機<span className="text-gradient-purple">展示</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            這不是 mockup — 這是我們每天在跑的 AI 內容引擎
          </p>
        </div>

        {/* Dashboard */}
        <DashboardMockup visible={isInView} stats={liveStats} />

        {/* Live counter */}
        <LiveCounter visible={isInView} baseCount={liveStats.totalPosts} />
      </div>
    </section>
  )
}
