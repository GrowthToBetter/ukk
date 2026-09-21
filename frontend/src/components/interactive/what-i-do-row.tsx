'use client'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

interface RowProps {
  index: string
  title: string
  detail: string
  thumbnail: string
}

export function WhatIDoRow({ index, title, detail }: Omit<RowProps, 'thumbnail'>) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      layout
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      className="border-b border-paper-050/20"
      transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
    >
      <div className="flex items-baseline gap-4 py-8">
        <span className="tabular-nums text-fs-index text-accent-050/70">[{index}]</span>
        <span className="font-display text-4xl">{title}</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-4 overflow-hidden pb-8"
          >
            <p className="max-w-md font-body text-paper-050/80">{detail}</p>
            <div className="h-24 w-36 bg-paper-050/20" /> {/* Thumbnail placeholder */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
