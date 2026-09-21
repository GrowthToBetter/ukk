'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    
    // @ts-expect-error: Store Lenis instance for navigation clicks
    window.lenis = lenis

    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    const raf = requestAnimationFrame(() => {
        ScrollTrigger.refresh()
    })

    return () => {
      cancelAnimationFrame(raf)
      // @ts-expect-error: Clean up global reference
      delete window.lenis
      lenis.destroy()
      gsap.ticker.remove(lenis.raf as unknown as (time: number) => void)
    }
  }, [])

  return <>{children}</>
}
