import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../lib/cart'

export interface Product {
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

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart()

  const outOfStock = product.type === 'physical' && product.stock === 0

  function handleAdd() {
    if (outOfStock) return
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0] || '',
        type: product.type,
      },
    })
  }

  return (
    <div className="group rounded-2xl bg-white border border-slate-100 overflow-hidden transition-all duration-200 hover:border-slate-200 hover:scale-[1.02]"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      {/* Image */}
      <div className="aspect-square bg-slate-50 relative overflow-hidden">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ShoppingBag size={32} />
          </div>
        )}
        {/* Type badge */}
        {product.type === 'digital' && (
          <span
            className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Digital
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs text-slate-500 font-medium">售完</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-800 mb-0.5 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span
            className="text-sm font-bold text-slate-800"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            NT${product.price.toLocaleString()}
          </span>

          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-900 text-white hover:bg-slate-700 active:scale-95"
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
