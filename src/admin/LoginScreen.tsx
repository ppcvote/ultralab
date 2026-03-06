import { useState } from 'react'
import { LogIn, AlertCircle, Loader2 } from 'lucide-react'
import { signInWithGoogle } from '../lib/auth'

export default function LoginScreen() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await signInWithGoogle()
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
      if (result.user.email !== adminEmail) {
        setError('此帳號無管理員權限')
        const { getFirebaseAuth } = await import('../lib/firebase')
        await getFirebaseAuth().signOut()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登入失敗'
      if (!msg.includes('popup-closed')) {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0515] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Ultra Lab
          </h1>
          <p className="text-sm text-slate-500">Admin Dashboard</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #8A5CFF, #CE4DFF)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            Google 登入
          </button>

          {error && (
            <div className="mt-4 flex items-start gap-2 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          僅限管理員登入
        </p>
      </div>
    </div>
  )
}
