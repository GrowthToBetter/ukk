'use client'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Role {
  index: string
  title: string
  org: string
  period: string
}

export function Experience({ roles }: { roles: Role[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)
  const roleRefs = useRef<HTMLDivElement[]>([])

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()

    mm.add(
      {
        full: '(prefers-reduced-motion: no-preference) and (min-width: 768px)',
      },
      () => {
        const ctx = gsap.context(() => {
          gsap.to(markerRef.current, {
            y: () => railRef.current!.offsetHeight - markerRef.current!.offsetHeight,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: true,
            },
          })

          roleRefs.current.forEach((el) => {
            ScrollTrigger.create({
              trigger: el,
              start: 'top center',
              onEnter: () => el.classList.add('is-active'),
              onLeaveBack: () => el.classList.remove('is-active'),
            })
          })
        }, sectionRef)
        return () => ctx.revert()
      }
    )

    return () => mm.revert()
  }, [])

  return (
    <section ref={sectionRef} id="experience" className="relative min-h-screen bg-paper-050 p-6 pt-24">
      <div ref={railRef} className="absolute left-6 top-24 h-[calc(100%-8rem)] w-px bg-ink-200 hidden md:block">
        <div ref={markerRef} className="h-6 w-px bg-accent-500" />
      </div>
      <div className="md:pl-12 space-y-12">
        {roles.map((role, i) => (
          <div key={role.index} ref={(el) => { if (el) roleRefs.current[i] = el; }} className="role-row transition-opacity opacity-50 [.is-active&]:opacity-100">
            <span className="tabular-nums text-fs-index text-accent-500">[{role.index}]</span>
            <h3 className="font-display text-4xl mt-2">{role.title}</h3>
            <p className="font-body text-ink-600">{role.org} · {role.period}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
