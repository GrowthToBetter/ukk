'use client'

const features = [
  { title: 'Ketersediaan Real-Time', detail: 'Cek ketersediaan ruang secara langsung tanpa perlu menunggu konfirmasi manual.' },
  { title: 'Promo & Diskon', detail: 'Dapatkan harga spesial dengan menggunakan kode promo saat booking.' },
  { title: 'Check-in QR Code', detail: 'Masuk lebih praktis dengan e-ticket berteknologi QR Code.' },
]

export function Keunggulan() {
  return (
    <section id="keunggulan" className="min-h-screen bg-paper-100 p-12 flex flex-col justify-center">
      <h2 className="font-display text-fs-h2 mb-12 text-ink-950">Keunggulan</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <div key={i} className="border border-ink-200 p-8">
            <span className="font-mono text-fs-index text-accent-500">[{String(i + 1).padStart(2, '0')}]</span>
            <h3 className="font-display text-4xl mt-4 text-ink-950">{f.title}</h3>
            <p className="font-body text-fs-body mt-2 text-ink-600">{f.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
