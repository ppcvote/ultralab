import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  Filter,
} from 'lucide-react'

type OrderStatus = 'pending' | 'paid' | 'failed' | 'shipped' | 'completed'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  type: string
}

interface Order {
  id: string
  merTradeNo: string
  items: OrderItem[]
  totalAmount: number
  customer: {
    name: string
    email: string
    phone: string
    address?: string
  }
  status: OrderStatus
  payuniTradeNo?: string
  paymentMethod?: string
  paidAt?: Timestamp
  createdAt: Timestamp
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: '待付款', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: Clock },
  paid: { label: '已付款', color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: CheckCircle },
  shipped: { label: '已出貨', color: '#4DA3FF', bg: 'rgba(77,163,255,0.15)', icon: Truck },
  completed: { label: '已完成', color: '#8A5CFF', bg: 'rgba(138,92,255,0.15)', icon: CheckCircle },
  failed: { label: '失敗', color: '#FF6A6A', bg: 'rgba(255,106,106,0.15)', icon: XCircle },
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'completed', 'failed']

// Allowed transitions
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'shipped',
  shipped: 'completed',
}

function formatDate(ts: Timestamp | undefined) {
  if (!ts) return '—'
  const d = ts.toDate()
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const config = STATUS_CONFIG[order.status]
  const nextStatus = NEXT_STATUS[order.status]
  const nextConfig = nextStatus ? STATUS_CONFIG[nextStatus] : null

  async function handleAdvance() {
    if (!nextStatus) return
    setUpdating(true)
    try {
      await updateDoc(doc(getDb(), 'orders', order.id), { status: nextStatus })
      onUpdate()
    } catch (err) {
      console.error('Failed to update order:', err)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span
              className="text-sm font-medium text-white"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {order.merTradeNo}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ color: config.color, background: config.bg }}
            >
              <config.icon size={10} />
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{order.customer.name}</span>
            <span>·</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              NT${order.totalAmount.toLocaleString()}
            </span>
            <span>·</span>
            <span>{order.items.length} 件</span>
            <span>·</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {/* Details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          {/* Customer */}
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <span className="text-slate-500">Email</span>
              <p className="text-white">{order.customer.email}</p>
            </div>
            <div>
              <span className="text-slate-500">電話</span>
              <p className="text-white">{order.customer.phone}</p>
            </div>
            {order.customer.address && (
              <div className="col-span-2">
                <span className="text-slate-500">地址</span>
                <p className="text-white">{order.customer.address}</p>
              </div>
            )}
            {order.payuniTradeNo && (
              <div>
                <span className="text-slate-500">PAYUNi 編號</span>
                <p className="text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {order.payuniTradeNo}
                </p>
              </div>
            )}
            {order.paymentMethod && (
              <div>
                <span className="text-slate-500">付款方式</span>
                <p className="text-white">{order.paymentMethod}</p>
              </div>
            )}
            {order.paidAt && (
              <div>
                <span className="text-slate-500">付款時間</span>
                <p className="text-white">{formatDate(order.paidAt)}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mt-4 border-t border-white/5 pt-4">
            <span className="text-xs text-slate-500 block mb-2">商品明細</span>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{item.name}</span>
                    <span className="text-slate-500">x{item.quantity}</span>
                    {item.type === 'digital' && (
                      <span className="text-[10px] px-1 rounded bg-indigo-500/20 text-indigo-400">digital</span>
                    )}
                  </div>
                  <span className="text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    NT${(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
                <span className="font-medium text-white">合計</span>
                <span className="font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  NT${order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Next status action */}
          {nextConfig && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <button
                onClick={handleAdvance}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: nextConfig.color }}
              >
                {updating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <nextConfig.icon size={14} />
                )}
                標記為「{nextConfig.label}」
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  async function fetchOrders() {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(getDb(), 'orders'))
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Order)
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      setOrders(items)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter)

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: '總訂單', value: stats.total, color: '#8A5CFF' },
          { label: '待付款', value: stats.pending, color: '#F59E0B' },
          { label: '已付款', value: stats.paid, color: '#10B981' },
          { label: '已出貨', value: stats.shipped, color: '#4DA3FF' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <span className="text-xs text-slate-500">{s.label}</span>
            <p className="text-2xl font-bold text-white mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {s.value}
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
                filter === 'all' ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              全部
            </button>
            {ALL_STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s]
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    color: filter === s ? '#fff' : cfg.color,
                    background: filter === s ? cfg.color : 'transparent',
                  }}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          重新載入
        </button>
      </div>

      {/* Order list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-purple-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Package size={32} className="mb-2 opacity-50" />
          <p className="text-sm">沒有訂單</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onUpdate={fetchOrders} />
          ))}
        </div>
      )}
    </div>
  )
}
