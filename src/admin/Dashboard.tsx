import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import {
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Filter,
  RefreshCw,
  LogOut,
  Package,
  ShoppingBag,
} from 'lucide-react'
import { signOut } from '../lib/auth'
import EmailSection from './EmailSection'
import ProductManager from './ProductManager'
import OrderManager from './OrderManager'

type AdminTab = 'inquiries' | 'products' | 'orders'

type InquiryStatus = 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost'

interface Inquiry {
  id: string
  name: string
  email: string
  phone: string
  lineId: string
  company: string
  service: string
  budget: string
  message: string
  contactMethod: string
  source: string
  createdAt: Timestamp
  status?: InquiryStatus
  notes?: string
  updatedAt?: Timestamp
}

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string; bg: string }> = {
  new: { label: '新詢問', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  contacted: { label: '已聯繫', color: '#4DA3FF', bg: 'rgba(77,163,255,0.15)' },
  negotiating: { label: '洽談中', color: '#CE4DFF', bg: 'rgba(206,77,255,0.15)' },
  closed: { label: '成交', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  lost: { label: '流失', color: '#FF6A6A', bg: 'rgba(255,106,106,0.15)' },
}

const ALL_STATUSES: InquiryStatus[] = ['new', 'contacted', 'negotiating', 'closed', 'lost']

function StatusBadge({ status }: { status: InquiryStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  )
}

function formatDate(ts: Timestamp | undefined) {
  if (!ts) return '—'
  const d = ts.toDate()
  return d.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InquiryCard({
  inquiry,
  onUpdate,
}: {
  inquiry: Inquiry
  onUpdate: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status || 'new')
  const [notes, setNotes] = useState(inquiry.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(getDb(), 'inquiries', inquiry.id), {
        status,
        notes,
        updatedAt: serverTimestamp(),
      })
      onUpdate()
    } catch (err) {
      console.error('Failed to update inquiry:', err)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = status !== (inquiry.status || 'new') || notes !== (inquiry.notes || '')

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-medium text-white truncate">{inquiry.name}</span>
            <StatusBadge status={inquiry.status || 'new'} />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{inquiry.service || '未選服務'}</span>
            <span>·</span>
            <span>{inquiry.budget || '未填預算'}</span>
            <span>·</span>
            <span>{formatDate(inquiry.createdAt)}</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <span className="text-slate-500">Email</span>
              <p className="text-white">{inquiry.email}</p>
            </div>
            <div>
              <span className="text-slate-500">電話</span>
              <p className="text-white">{inquiry.phone || '—'}</p>
            </div>
            <div>
              <span className="text-slate-500">LINE ID</span>
              <p className="text-white">{inquiry.lineId || '—'}</p>
            </div>
            <div>
              <span className="text-slate-500">公司</span>
              <p className="text-white">{inquiry.company || '—'}</p>
            </div>
            <div>
              <span className="text-slate-500">偏好聯繫方式</span>
              <p className="text-white">{inquiry.contactMethod || '—'}</p>
            </div>
            <div>
              <span className="text-slate-500">來源</span>
              <p className="text-white">{inquiry.source || 'landing-page'}</p>
            </div>
          </div>

          {inquiry.message && (
            <div className="mt-4 text-sm">
              <span className="text-slate-500">留言</span>
              <p className="text-white mt-1 whitespace-pre-wrap">{inquiry.message}</p>
            </div>
          )}

          {/* Status + Notes editing */}
          <div className="mt-5 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-slate-500">狀態</span>
              <div className="flex gap-1.5">
                {ALL_STATUSES.map((s) => {
                  const config = STATUS_CONFIG[s]
                  const isActive = status === s
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        color: isActive ? '#fff' : config.color,
                        background: isActive ? config.color : config.bg,
                      }}
                    >
                      {config.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-3">
              <span className="text-sm text-slate-500">備註</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 resize-none"
                placeholder="新增備註..."
              />
            </div>

            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)' }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                儲存
              </button>
            )}
          </div>

          {/* Email section */}
          <EmailSection
            inquiryId={inquiry.id}
            recipientEmail={inquiry.email}
            recipientName={inquiry.name}
          />
        </div>
      )}
    </div>
  )
}

function InquiryPanel() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<InquiryStatus | 'all'>('all')

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(getDb(), 'inquiries'))
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Inquiry[]
      docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      setInquiries(docs)
    } catch (err) {
      console.error('Failed to fetch inquiries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [])

  const filtered = filter === 'all'
    ? inquiries
    : inquiries.filter((i) => (i.status || 'new') === filter)

  const stats = {
    total: inquiries.length,
    new: inquiries.filter((i) => !i.status || i.status === 'new').length,
    contacted: inquiries.filter((i) => i.status === 'contacted').length,
    negotiating: inquiries.filter((i) => i.status === 'negotiating').length,
    closed: inquiries.filter((i) => i.status === 'closed').length,
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: '總詢問', value: stats.total, icon: Users, color: '#8A5CFF' },
          { label: '新詢問', value: stats.new, icon: Clock, color: '#F59E0B' },
          { label: '已聯繫', value: stats.contacted, icon: MessageSquare, color: '#4DA3FF' },
          { label: '洽談中', value: stats.negotiating, icon: MessageSquare, color: '#CE4DFF' },
          { label: '成交', value: stats.closed, icon: CheckCircle, color: '#10B981' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} style={{ color: stat.color }} />
              <span className="text-xs text-slate-500">{stat.label}</span>
            </div>
            <p
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter + Refresh */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              全部
            </button>
            {ALL_STATUSES.map((s) => {
              const config = STATUS_CONFIG[s]
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    color: filter === s ? '#fff' : config.color,
                    background: filter === s ? config.color : 'transparent',
                  }}
                >
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>
        <button
          onClick={fetchInquiries}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          重新載入
        </button>
      </div>

      {/* Inquiry list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-purple-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <XCircle size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500">沒有符合的詢問</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              onUpdate={fetchInquiries}
            />
          ))}
        </div>
      )}
    </>
  )
}

const TABS: { key: AdminTab; label: string; icon: typeof Users }[] = [
  { key: 'inquiries', label: '客戶詢問', icon: Users },
  { key: 'products', label: '商品管理', icon: Package },
  { key: 'orders', label: '訂單管理', icon: ShoppingBag },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('inquiries')

  return (
    <div className="min-h-screen bg-[#0A0515] text-slate-50" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1
              className="text-lg font-bold text-white"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Ultra Lab
            </h1>
            <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full border border-white/10">
              Admin
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            登出
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'inquiries' && <InquiryPanel />}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'orders' && <OrderManager />}
      </div>
    </div>
  )
}
