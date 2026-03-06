/* ── Shared Agent Definitions ──
   Used by AgentApp (cards/manifest) and NerveCenter (sprites/rooms) */

/* ── Types ── */
export interface AgentSkill {
  name: string
  label: string
}

export interface AgentMeta {
  id: string
  name: string
  shortName: string
  emoji: string
  role: string
  description: string
  color: string
  topics: string[]
  skills: AgentSkill[]
  moltbook?: string
  telegram?: string
  product?: string
  comingSoon?: boolean
}

export interface AgentVisual {
  id: string
  skin: string
  body: string
  /** Sprite accessory type for personalized look */
  accessory: 'hair' | 'headphones' | 'hood' | 'tie'
  /** Movement speed multiplier (1 = normal) */
  speed: number
  /** Corridor Y lane offset to avoid overlap */
  corridorY: number
  tasks: string[]
}

export interface RoomDef {
  id: string
  label: string
  color: string
  top: number
  left: number
  w: number
  h: number
  /** Which agent "owns" this room (null = shared) */
  owner: string | null
  /** Door position relative to corridor (% coords) */
  door: { x: number; y: number }
  /** Agent desk position inside room (% coords) */
  desk: { x: number; y: number }
  /** Agent pacing waypoint inside room (% coords) */
  pace: { x: number; y: number }
}

/* ── Agent Meta (for cards, manifest, popup) ── */
export const AGENTS_META: AgentMeta[] = [
  {
    id: 'main',
    name: 'UltraLabTW',
    shortName: 'UltraLab',
    emoji: '⚡',
    role: 'AI Thought Leader',
    description: '總部 Agent — AI 安全、自動化、SaaS 開發的技術佈道者。在 Moltbook 上代表 Ultra Lab 品牌發文互動。',
    color: '#8A5CFF',
    moltbook: 'https://www.moltbook.com/u/ultralabtw',
    telegram: 'https://t.me/Ultra_Agentbot',
    topics: ['AI 安全', 'SaaS 開發', '自動化', 'Agent 文化'],
    skills: [
      { name: 'moltbook', label: 'Moltbook 社群操作' },
      { name: 'pricing-info', label: '產品報價查詢' },
      { name: 'market-research', label: '市場研究分析' },
      { name: 'deep-research', label: '深度網路研究' },
      { name: 'youtube-transcript', label: 'YouTube 字幕擷取' },
      { name: 'social-manager', label: '社群媒體管理' },
      { name: 'content-strategy', label: '內容策略規劃' },
      { name: 'security-vuln-scanner', label: '安全漏洞掃描' },
      { name: 'agent-evaluation', label: 'Agent 效能評估' },
    ],
  },
  {
    id: 'mind',
    name: 'MindThreadBot',
    shortName: 'MindThr',
    emoji: '🧵',
    role: 'Social Media Specialist',
    description: '社群自動化專家 — 專精 Threads 多帳號管理、AI 內容生成、排程發布。用數據說話的社群成長策略師。',
    color: '#14B8A6',
    moltbook: 'https://www.moltbook.com/u/mindthreadbot',
    product: 'https://mindthread.tw',
    topics: ['Threads 自動化', '內容行銷', '社群成長', 'AI 文案'],
    skills: [
      { name: 'pricing-info', label: '產品報價查詢' },
      { name: 'market-research', label: '市場研究分析' },
      { name: 'deep-research', label: '深度網路研究' },
      { name: 'youtube-transcript', label: 'YouTube 字幕擷取' },
      { name: 'content-strategy', label: '內容策略規劃' },
    ],
  },
  {
    id: 'probe',
    name: 'UltraProbeBot',
    shortName: 'Probe',
    emoji: '🔍',
    role: 'AI Security Researcher',
    description: 'AI 安全研究員 — 19 種攻擊向量、200+ 個 LLM 應用掃描經驗。分享漏洞發現和防禦策略。',
    color: '#EF4444',
    moltbook: 'https://www.moltbook.com/u/ultraprobebot',
    product: 'https://ultralab.tw/probe',
    topics: ['Prompt Injection', 'LLM 漏洞', '安全掃描', '防禦策略'],
    skills: [
      { name: 'ultraprobe-scan', label: 'AI 漏洞掃描' },
      { name: 'market-research', label: '市場研究分析' },
      { name: 'deep-research', label: '深度網路研究' },
      { name: 'youtube-transcript', label: 'YouTube 字幕擷取' },
      { name: 'security-vuln-scanner', label: '安全漏洞掃描' },
    ],
  },
  {
    id: 'adv',
    name: 'UltraAdvisor',
    shortName: 'Advisor',
    emoji: '💰',
    role: 'Financial Advisor',
    description: '財務規劃顧問團隊 — 提供退休規劃、保險策略、資產配置等專業財務素養知識。',
    color: '#F59E0B',
    product: 'https://www.ultra-advisor.tw',
    topics: ['退休規劃', '保險策略', '資產配置', '財務素養'],
    skills: [
      { name: 'market-research', label: '市場研究分析' },
      { name: 'deep-research', label: '深度網路研究' },
      { name: 'youtube-transcript', label: 'YouTube 字幕擷取' },
    ],
  },
]

/* ── Agent Visuals (for NerveCenter sprites) ── */
export const AGENTS_VISUAL: AgentVisual[] = [
  {
    id: 'main',
    skin: '#C4956A', body: '#6B3FA0',
    accessory: 'hair',
    speed: 1.0,
    corridorY: 48,
    tasks: ['Drafting post...', 'Trend analysis...', 'Publishing...', 'Fleet briefing...'],
  },
  {
    id: 'mind',
    skin: '#B8D4E3', body: '#115E59',
    accessory: 'headphones',
    speed: 1.25,
    corridorY: 46,
    tasks: ['Queue staged...', 'Scheduling posts...', 'Content gen...', 'Hashtag research...'],
  },
  {
    id: 'probe',
    skin: '#8B9DAF', body: '#7F1D1D',
    accessory: 'hood',
    speed: 0.85,
    corridorY: 54,
    tasks: ['Probing endpoints...', 'Injecting prompts...', 'Scanning LLM...', 'Writing report...'],
  },
  {
    id: 'adv',
    skin: '#D4A574', body: '#92400E',
    accessory: 'tie',
    speed: 0.75,
    corridorY: 52,
    tasks: ['Retirement analysis...', 'Insurance review...', 'Portfolio planning...', 'Client brief...'],
  },
]

/* ── Room Definitions ──
   5 rooms: 2 top + corridor gap + 3 bottom
   All coordinates in % of the floorplan container
   Door positions are on the corridor-facing wall */
export const ROOMS: RoomDef[] = [
  {
    id: 'cmd', label: 'COMMAND', color: '#8A5CFF',
    top: 4, left: 2, w: 35, h: 39,
    owner: 'main',
    door: { x: 19, y: 43 },
    desk: { x: 15, y: 20 },
    pace: { x: 24, y: 28 },
  },
  {
    id: 'srv', label: 'SERVER ROOM', color: '#4DA3FF',
    top: 4, left: 63, w: 35, h: 39,
    owner: null,
    door: { x: 80, y: 43 },
    desk: { x: 75, y: 20 },
    pace: { x: 85, y: 28 },
  },
  {
    id: 'soc', label: 'SOCIAL HUB', color: '#14B8A6',
    top: 57, left: 2, w: 28, h: 39,
    owner: 'mind',
    door: { x: 16, y: 57 },
    desk: { x: 11, y: 73 },
    pace: { x: 19, y: 80 },
  },
  {
    id: 'sec', label: 'SEC-LAB', color: '#EF4444',
    top: 57, left: 35, w: 28, h: 39,
    owner: 'probe',
    door: { x: 49, y: 57 },
    desk: { x: 44, y: 73 },
    pace: { x: 52, y: 80 },
  },
  {
    id: 'adv', label: 'ADVISORY', color: '#F59E0B',
    top: 57, left: 68, w: 28, h: 39,
    owner: 'adv',
    door: { x: 82, y: 57 },
    desk: { x: 79, y: 73 },
    pace: { x: 85, y: 80 },
  },
]

/* ── Helper: look up agent meta + visual combined ── */
export function getAgent(id: string) {
  const meta = AGENTS_META.find(a => a.id === id)
  const visual = AGENTS_VISUAL.find(a => a.id === id)
  return meta && visual ? { ...meta, ...visual } : null
}

/* ── Helper: find room by owner agent id ── */
export function getHomeRoom(agentId: string): RoomDef | undefined {
  return ROOMS.find(r => r.owner === agentId)
}

export function getRoom(roomId: string): RoomDef | undefined {
  return ROOMS.find(r => r.id === roomId)
}
