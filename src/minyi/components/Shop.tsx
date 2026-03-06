import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { ShoppingBag } from 'lucide-react'
import { getDb } from '../../lib/firebase'
import { useCart } from '../../lib/cart'
import { useInView } from '../../hooks/useInView'
import ProductCard, { type Product } from './ProductCard'

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { totalItems, dispatch } = useCart()
  const { ref, isInView } = useInView({ threshold: 0.1 })

  const base = 'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]'
  const hidden = 'opacity-0 translate-y-6'
  const visible = 'opacity-100 translate-y-0'

  useEffect(() => {
    async function fetchProducts() {
      try {
        const db = getDb()
        const q = query(
          collection(db, 'products'),
          where('active', '==', true),
        )
        const snapshot = await getDocs(q)
        const items = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Product)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        setProducts(items)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Hide entire section when there are no products
  if (!loading && products.length === 0) return null

  return (
    <section ref={ref} className="px-6 pb-10">
      <p
        className={`text-[10px] uppercase tracking-widest text-slate-400 mb-4 text-center ${base} ${isInView ? visible : hidden}`}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        Shop
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto md:max-w-2xl md:grid-cols-3 lg:max-w-3xl">
          {products.map((product, i) => (
            <div
              key={product.id}
              className={`${base} ${isInView ? visible : hidden}`}
              style={{ transitionDelay: `${100 + i * 80}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {/* Floating cart button */}
      {totalItems > 0 && (
        <button
          onClick={() => dispatch({ type: 'OPEN_CART' })}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 animate-[scaleIn_0.3s_ease-out]"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
        >
          <ShoppingBag size={20} />
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        </button>
      )}
    </section>
  )
}
