'use client'
import { useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

export function useMagneticHover(strength = 0.3) {
  const ref = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()

  function onMouseMove(e: React.MouseEvent) {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * strength
    const y = (e.clientY - rect.top - rect.height / 2) * strength
    ref.current.style.transform = `translate(${x}px, ${y}px)`
  }

  function onMouseLeave() {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)'
  }

  return { ref, onMouseMove, onMouseLeave }
}
