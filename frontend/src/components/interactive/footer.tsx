'use client'
import Link from 'next/link'

export function Footer() {
  return (
    <footer id="kontak" className="min-h-screen bg-accent-900 text-paper-100 p-12 flex flex-col justify-between">
      <div className="flex-1 flex flex-col justify-center">
        <h2 className="font-display text-[clamp(6rem,11vw,11rem)] leading-none text-paper-100">
          On <span className="underline decoration-accent-500 underline-offset-8">purpose</span>
        </h2>
      </div>
      <div className="flex justify-between items-end font-mono text-fs-index">
        <a href="mailto:hello@spacebooking.local" className="text-4xl text-paper-100 hover:text-accent-500 underline decoration-2 underline-offset-4">
          hello@spacebooking.local ↗
        </a>
        <Link href="/register/admin" className="text-paper-100 underline hover:text-accent-500">Daftar sebagai Pengelola Space</Link>
        <span className="text-paper-100">[04 / 04]</span>
      </div>
    </footer>
  )
}
