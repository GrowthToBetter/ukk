'use client'
import { motion } from 'motion/react'
import Link from 'next/link'

export function FinalCTA() {
  return (
    <section id="kontak" className="relative overflow-hidden bg-ink-950 px-12 py-40 text-paper-100">
      {/* index-bracket raksasa sebagai elemen dekoratif background, bukan watermark kosong tanpa arah */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-8 select-none font-display text-[22rem] leading-none text-paper-100/[0.04]"
      >
        [06]
      </span>

      {/* crop-mark 4 sudut */}
      {['top-6 left-6', 'top-6 right-6', 'bottom-6 left-6', 'bottom-6 right-6'].map((pos) => (
        <span key={pos} aria-hidden className={`absolute ${pos} z-10 h-4 w-4 border-paper-100/20`} />
      ))}

      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.span
          className="block text-fs-index tabular-nums text-accent-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          [ MULAI SEKARANG ]
        </motion.span>

        <motion.h2
          className="mt-6 font-display leading-[0.95]"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Siap bekerja di tempat{' '}
          <span className="text-accent-500">terbaik Anda?</span>
        </motion.h2>

        <motion.div
          className="mt-14 flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/spaces" className="bg-accent-500 px-8 py-4 text-fs-body font-bold text-paper-100">
            Cari Space →
          </Link>
          <Link href="/register/admin" className="border border-paper-100/50 px-8 py-4 text-fs-body font-bold">
            Daftar Admin →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
