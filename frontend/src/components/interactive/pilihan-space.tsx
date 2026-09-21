'use client'
import Link from 'next/link'

const spaces = [
  { title: 'Personal Desk', desc: 'Meja kerja privat untuk kenyamanan maksimal.' },
  { title: 'Meeting Room', desc: 'Ruang kolaborasi tim yang nyaman.' },
  { title: 'Private Office', desc: 'Privasi penuh untuk perusahaan kecil.' },
]

export function PilihanSpace() {
  return (
    <section id="pilihan-space" className="min-h-screen bg-accent-900 p-12 flex flex-col justify-center">
      <h2 className="font-display text-fs-h2 mb-12 text-accent-050">Pilihan Space</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {spaces.map((s, i) => (
          <div key={i} className="border border-accent-050/20 p-8 flex flex-col">
            <span className="font-mono text-fs-index text-accent-500">[{String(i + 1).padStart(2, '0')}]</span>
            <h3 className="font-display text-4xl mt-4 text-paper-100">{s.title}</h3>
            <p className="font-body text-fs-body mt-2 text-accent-050/90 flex-grow">{s.desc}</p>
            <Link href="/spaces" className="mt-8 text-fs-body text-accent-500 font-bold underline">
              Lihat Detail →
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
