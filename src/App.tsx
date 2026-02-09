import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import HowItWorks from './components/HowItWorks'
import Portfolio from './components/Portfolio'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0A0515] text-slate-50" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <Portfolio />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  )
}
