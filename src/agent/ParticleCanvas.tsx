import { useRef, useEffect } from 'react'

/* Ambient floating light particles — gives depth to the floor plan.
   Soft glowing dots drift slowly upward with gentle sine drift.
   ~28 particles, very low opacity, purely atmospheric. */

const COLORS = ['138,92,255', '77,163,255', '20,184,166', '206,77,255']

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; baseAlpha: number; alpha: number
  color: string; phase: number
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const particles: Particle[] = Array.from({ length: 28 }, () => ({
      x: Math.random() * (w || 600),
      y: Math.random() * (h || 500),
      vx: (Math.random() - 0.5) * 0.2,
      vy: -(Math.random() * 0.12 + 0.04),
      size: Math.random() * 1.6 + 0.5,
      baseAlpha: Math.random() * 0.2 + 0.04,
      alpha: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
    }))

    let frame = 0
    let animId: number

    const animate = () => {
      ctx.clearRect(0, 0, w, h)
      frame++

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.x += Math.sin(frame * 0.007 + p.phase) * 0.08

        // breathing alpha
        p.alpha = p.baseAlpha * (0.5 + 0.5 * Math.sin(frame * 0.018 + p.phase))

        // wrap around
        if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w }
        if (p.x < -8) p.x = w + 8
        if (p.x > w + 8) p.x = -8

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.shadowBlur = p.size * 5
        ctx.shadowColor = `rgba(${p.color},${p.alpha})`
        ctx.fillStyle = `rgba(${p.color},${Math.min(1, p.alpha + 0.08)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  )
}
