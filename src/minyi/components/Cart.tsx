import { useState } from 'react'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../../lib/cart'
import CheckoutForm from './CheckoutForm'

export default function Cart() {
  const { items, isOpen, dispatch, totalItems, totalAmount } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={() => {
          dispatch({ type: 'CLOSE_CART' })
          setShowCheckout(false)
        }}
      />

      {/* Drawer — bottom sheet on mobile, right drawer on desktop */}
      <div className="fixed z-50 bg-white
        inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl
        md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:max-h-none md:rounded-t-none md:rounded-l-3xl
        flex flex-col shadow-2xl
        animate-[slideUp_0.3s_ease-out] md:animate-[slideLeft_0.3s_ease-out]"
      >
        {showCheckout ? (
          /* Checkout Form */
          <div className="flex-1 overflow-y-auto">
            <CheckoutForm onBack={() => setShowCheckout(false)} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-slate-700" />
                <h2 className="text-base font-semibold text-slate-800">購物車</h2>
                {totalItems > 0 && (
                  <span className="text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded-full"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={() => dispatch({ type: 'CLOSE_CART' })}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <ShoppingBag size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">購物車是空的</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag size={18} />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-800 truncate">{item.name}</h3>
                        <p className="text-xs text-slate-400 mb-1.5"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          NT${item.price.toLocaleString()}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dispatch({
                              type: 'UPDATE_QUANTITY',
                              payload: { productId: item.productId, quantity: item.quantity - 1 },
                            })}
                            className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                          >
                            <Minus size={12} className="text-slate-500" />
                          </button>
                          <span className="text-xs font-medium text-slate-700 w-5 text-center"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => dispatch({
                              type: 'UPDATE_QUANTITY',
                              payload: { productId: item.productId, quantity: item.quantity + 1 },
                            })}
                            className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                          >
                            <Plus size={12} className="text-slate-500" />
                          </button>
                          <button
                            onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.productId })}
                            className="ml-auto w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={12} className="text-slate-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer — checkout */}
            {items.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-500">合計</span>
                  <span className="text-lg font-bold text-slate-900"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    NT${totalAmount.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full h-12 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all duration-200 hover:bg-slate-800 active:scale-[0.98]"
                >
                  前往結帳
                </button>
                <button
                  onClick={() => dispatch({ type: 'CLEAR' })}
                  className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
                >
                  清空購物車
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
