'use client'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

const steps = ['tanggal-jam', 'ringkasan-promo', 'konfirmasi'] as const

export function BookingStepper({ render }: { render: (step: typeof steps[number]) => React.ReactNode }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  function goTo(next: number) {
    setDirection(next > index ? 1 : -1)
    setIndex(next)
  }

  return (
    <div className="relative overflow-hidden w-full">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={steps[index]}
          custom={direction}
          initial={{ x: direction * 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -direction * 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          {render(steps[index] as typeof steps[number])}
        </motion.div>
      </AnimatePresence>
        <div className="mt-12 flex gap-4 text-fs-index font-mono text-ink-600">
        {steps.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className={`stepper-nav-btn ${i === index ? 'text-accent-500 font-bold' : 'hover:text-ink-950'}`}>
            [{String(i + 1).padStart(2, '0')}]
          </button>
        ))}
      </div>

    </div>
  )
}
