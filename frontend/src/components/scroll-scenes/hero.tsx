'use client'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <section id="hero" className="relative min-h-screen bg-paper-100 text-ink-950 flex flex-col justify-center px-12 py-32">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="text-fs-index tabular-nums text-accent-500 block mb-10">
          [ SMART SPACE BOOKING ]
        </span>

        <h1 className="font-display leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)' }}>
          <span className="block">BOOKING RUANG</span>
          <span className="flex flex-wrap items-center gap-6">
            <span className="relative h-[0.85em] w-[2.2em] shrink-0 overflow-hidden">
              <Image src="/coworking-space.jpg" alt="" fill className="object-cover" />
            </span>
            KERJA,
          </span>
          <span className="block text-accent-500">LEBIH MUDAH</span>
        </h1>

        <div className="mt-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-fs-body-lg text-ink-600">
            Reservasi Personal Desk, Meeting Room, atau Private Office secara online.
            Akses ketersediaan real-time saat ini.
          </p>
          <div className="flex gap-4">
            <Link href="/spaces" className="bg-accent-500 px-6 py-3 text-fs-body font-bold text-paper-100">
              Cari Space →
            </Link>
            <Link href="/register/admin" className="border border-ink-950 px-6 py-3 text-fs-body font-bold text-ink-950">
              Daftarkan Space Anda →
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-10 left-12 text-fs-index tabular-nums text-ink-600"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        [ SCROLL ] ↓
      </motion.div>
    </section>
  )
}
