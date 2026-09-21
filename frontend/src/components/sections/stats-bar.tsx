'use client'
import { motion } from 'motion/react'
import { IndexBracket } from '@/components/interactive/index-bracket'

const stats = [
  { n: '01', label: 'Ruang Tersedia', value: '14' },
  { n: '02', label: 'Booking Berhasil', value: '450+' },
  { n: '03', label: 'Approval (min)', value: '5' },
]

export function StatsBar() {
  return (
    <section id="stats" className="border-t border-b border-ink-200 bg-paper-100 p-12 md:p-24">
      <div className="grid md:grid-cols-3 gap-12">
        {stats.map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`flex flex-col ${i === 1 ? 'md:items-center' : i === 2 ? 'md:items-end' : ''}`}
          >
            <IndexBracket n={s.n} />
            <p className="font-body text-ink-600 mt-4 uppercase tracking-widest text-xs">{s.label}</p>
            <h3 className={`font-display mt-2 ${i === 1 ? 'text-[clamp(4rem,8vw,8rem)]' : 'text-[clamp(3rem,6vw,6rem)]'}`}>
              <span className="tabular-nums">{s.value}</span>
            </h3>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
