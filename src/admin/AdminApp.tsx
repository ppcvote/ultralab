import { useAuth } from '../lib/auth'
import { Loader2 } from 'lucide-react'
import LoginScreen from './LoginScreen'
import Dashboard from './Dashboard'

export default function AdminApp() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0515] flex items-center justify-center">
        <Loader2 size={24} className="text-purple-500 animate-spin" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <LoginScreen />
  }

  return <Dashboard />
}
