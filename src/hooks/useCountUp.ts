import { useState, useEffect } from 'react'

/**
 * Animates a number from 0 to `end` over `duration` ms.
 * Only starts when `start` is true (use with useInView).
 */
export function useCountUp(end: number, duration = 2000, start = true): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setCount(end)
      return
    }

    let startTime: number | null = null
    let raf: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        raf = requestAnimationFrame(step)
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [end, duration, start])

  return count
}
