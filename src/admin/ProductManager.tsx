import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Package,
  Image as ImageIcon,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  type: 'physical' | 'digital'
  stock: number
  active: boolean
  sortOrder: number
}

const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  name: '',
  description: '',
  price: 0,
  images: [''],
  type: 'physical',
  stock: 0,
  active: true,
  sortOrder: 0,
}

function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Product, 'id'> & { id?: string }
  onSave: (data: Omit<Product, 'id'> & { id?: string }) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  const isEdit = !!initial.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  function updateImage(index: number, value: string) {
    const updated = [...form.images]
    updated[index] = value
    setForm({ ...form, images: updated })
  }

  function addImageField() {
    setForm({ ...form, images: [...form.images, ''] })
  }

  function removeImageField(index: number) {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0f0a1e] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">
            {isEdit ? '編輯商品' : '新增商品'}
          </h3>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">商品名稱 *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="極簡皮革筆記本"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">簡短描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="手工義大利植鞣皮革，A5 大小..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Price + Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">價格 (TWD) *</label>
              <input
                type="number"
                required
                min={1}
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                placeholder="890"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">類型</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'physical' | 'digital' })}
                className={inputClass}
              >
                <option value="physical">實體商品</option>
                <option value="digital">數位商品</option>
              </select>
            </div>
          </div>

          {/* Stock + Sort */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                庫存 {form.type === 'digital' && <span className="text-slate-600">(-1 = 無限)</span>}
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                min={-1}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">排序（數字小的排前面）</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">圖片 URL</label>
            {form.images.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={url}
                  onChange={(e) => updateImage(i, e.target.value)}
                  placeholder="https://..."
                  className={`${inputClass} flex-1`}
                />
                {form.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageField(i)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addImageField}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ImageIcon size={12} />
              新增圖片
            </button>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="accent-purple-500"
            />
            <span className="text-sm text-slate-400">上架中</span>
          </label>

          {/* Preview */}
          {form.images[0] && (
            <div className="rounded-lg overflow-hidden border border-white/10">
              <img
                src={form.images[0]}
                alt="Preview"
                className="w-full h-40 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isEdit ? '更新' : '建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<(Omit<Product, 'id'> & { id?: string }) | null>(null)

  async function fetchProducts() {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(getDb(), 'products'))
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Product)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      setProducts(items)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  async function handleSave(data: Omit<Product, 'id'> & { id?: string }) {
    const db = getDb()
    const images = data.images.filter((u) => u.trim())

    if (data.id) {
      // Update existing
      await updateDoc(doc(db, 'products', data.id), {
        name: data.name,
        description: data.description,
        price: data.price,
        images,
        type: data.type,
        stock: data.type === 'digital' ? -1 : data.stock,
        active: data.active,
        sortOrder: data.sortOrder,
      })
    } else {
      // Create new
      const newRef = doc(collection(db, 'products'))
      await setDoc(newRef, {
        name: data.name,
        description: data.description,
        price: data.price,
        images,
        type: data.type,
        stock: data.type === 'digital' ? -1 : data.stock,
        active: data.active,
        sortOrder: data.sortOrder,
        createdAt: serverTimestamp(),
      })
    }

    setEditing(null)
    fetchProducts()
  }

  async function handleToggleActive(product: Product) {
    await updateDoc(doc(getDb(), 'products', product.id), { active: !product.active })
    fetchProducts()
  }

  async function handleDelete(product: Product) {
    if (!confirm(`確定要刪除「${product.name}」？`)) return
    await deleteDoc(doc(getDb(), 'products', product.id))
    fetchProducts()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">商品管理</h2>
        <button
          onClick={() => setEditing({ ...EMPTY_PRODUCT })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)' }}
        >
          <Plus size={14} />
          新增商品
        </button>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-purple-500 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Package size={32} className="mb-2 opacity-50" />
          <p className="text-sm">還沒有商品</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/10 bg-white/5"
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                {product.images[0] ? (
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Package size={16} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-white truncate">{product.name}</span>
                  {product.type === 'digital' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      digital
                    </span>
                  )}
                  {!product.active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                      下架
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    NT${product.price.toLocaleString()}
                  </span>
                  <span>·</span>
                  <span>
                    庫存: {product.stock === -1 ? '∞' : product.stock}
                  </span>
                  <span>·</span>
                  <span>排序: {product.sortOrder}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleActive(product)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                  title={product.active ? '下架' : '上架'}
                >
                  {product.active ? (
                    <Eye size={14} className="text-emerald-400" />
                  ) : (
                    <EyeOff size={14} className="text-slate-500" />
                  )}
                </button>
                <button
                  onClick={() => setEditing({ ...product })}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                  title="編輯"
                >
                  <Pencil size={14} className="text-slate-400" />
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                  title="刪除"
                >
                  <Trash2 size={14} className="text-slate-400 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create modal */}
      {editing && (
        <ProductForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
