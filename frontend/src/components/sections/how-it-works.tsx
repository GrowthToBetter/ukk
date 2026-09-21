'use client'
import { motion } from 'motion/react'
import { IndexBracket } from '@/components/interactive/index-bracket'

const steps = [
  { n: '01', title: 'Cari Space', desc: 'Pilih tipe space yang sesuai dengan kebutuhan Anda.' },
  { n: '02', title: 'Pilih Jadwal', desc: 'Tentukan tanggal dan durasi reservasi secara online.' },
  { n: '03', title: 'Konfirmasi', desc: 'Segera dapatkan e-ticket setelah pembayaran terverifikasi.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-paper-100 px-12 py-32">
      <div className="max-w-4xl mx-auto">
        {steps.map((step, i) => (
          <div key={step.n} className="grid md:grid-cols-[120px,1fr] gap-x-16 border-b border-ink-200 py-10 last:border-0">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
            >
                <IndexBracket n={step.n} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 + 0.1 }}
            >
              <h3 className="font-display text-3xl text-ink-950">{step.title}</h3>
              <p className="font-body text-fs-body text-ink-600 mt-2">{step.desc}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  )
}
