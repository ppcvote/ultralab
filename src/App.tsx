import { useState, useEffect, lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import TrustLogos from './components/TrustLogos'
import Services from './components/Services'
import ProductShowcase from './components/ProductShowcase'
import Portfolio from './components/Portfolio'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const MinYiApp = lazy(() => import('./minyi/MinYiApp'))
const ProbeApp = lazy(() => import('./probe/ProbeApp'))
const AgentApp = lazy(() => import('./agent/AgentApp'))
const AgentPartnerPage = lazy(() => import('./agent/AgentPartnerPage'))

function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="scroll-progress"
      style={{ transform: `scaleX(${progress})` }}
    />
  )
}

function SectionDivider() {
  return <div className="section-divider" />
}

function LandingPage() {
  return (
    <div className="noise-overlay min-h-screen bg-[#0A0515] text-slate-50" style={{ fontFamily: "'Outfit', system-ui, sans-serif", overflowX: 'hidden' }}>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <TrustLogos />
        <SectionDivider />
        <Services />
        <SectionDivider />
        <ProductShowcase />
        <SectionDivider />
        <Portfolio />
        <SectionDivider />
        <Pricing />
        <SectionDivider />
        <FAQ />
        <SectionDivider />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#0A0515] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  const path = window.location.pathname
  const isAdmin = path.startsWith('/admin')
  const isMinYi = path.startsWith('/minyi')
  const isProbe = path.startsWith('/probe')
  const isAgentPartner = path.startsWith('/agent-partner')
  const isAgent = path.startsWith('/agent')

  if (isAgentPartner) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AgentPartnerPage />
      </Suspense>
    )
  }

  if (isAgent) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AgentApp />
      </Suspense>
    )
  }

  if (isProbe) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ProbeApp />
      </Suspense>
    )
  }

  if (isAdmin) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AdminApp />
      </Suspense>
    )
  }

  if (isMinYi) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <MinYiApp />
      </Suspense>
    )
  }

  return <LandingPage />
}
