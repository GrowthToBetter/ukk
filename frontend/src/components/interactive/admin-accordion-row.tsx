'use client'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

export function AdminAccordionRow({
  index, title, subtitle, thumbnail, children, onExpand,
}: {
  index: number; title: string; subtitle?: string; thumbnail?: string
  children: React.ReactNode; onExpand?: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div layout className="border-b border-ink-200" transition={{ layout: { duration: 0.3 } }}>
      <button
        className="flex w-full items-center gap-4 py-3 text-left hover:bg-paper-050"
        onClick={() => { setOpen((v) => !v); if (!open) onExpand?.() }}
      >
        <span className="font-mono text-fs-index text-ink-600">[{String(index).padStart(2, '0')}]</span>
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="h-10 w-10 object-cover bg-ink-200" />
        )}
        <span className="font-display text-ink-950 font-bold">{title}</span>
        {subtitle && <span className="ml-auto font-mono text-fs-index text-ink-600">{subtitle}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pb-4 bg-paper-050"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
