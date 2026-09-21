'use client'
import { useEffect, useState } from 'react'

export const sectionIds = ['hero', 'stats', 'pilihan-space', 'big-statement', 'how-it-works', 'kontak']

export function useActiveSection() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionIds.indexOf(entry.target.id)
            if (index !== -1) setActive(index)
          }
        })
      },
      { threshold: 0.5 }
    )
    
    // Select all sections based on IDs
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    
    return () => observer.disconnect()
  }, [])

  return active
}
