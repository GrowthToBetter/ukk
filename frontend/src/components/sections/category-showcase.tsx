'use client'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { IndexBracket } from '@/components/interactive/index-bracket'

const categories = [
  { n: '01', title: 'Personal Desk', img: '/coworking-space.jpg', aspect: '16/9' },
  { n: '02', title: 'Meeting Room', img: '/coworkingspace-2.jpg', aspect: '4/5' },
  { n: '03', title: 'Private Office', img: '/coworking-space.jpg', aspect: '1/1' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export function CategoryShowcase() {
  return (
    <section id="pilihan-space" className="p-12 md:p-24 bg-paper-100 border-b border-ink-200">
      <h2 className="font-display text-fs-h2 mb-20 text-ink-950">Pilihan Space</h2>
      <motion.div 
        variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
        className="grid md:grid-cols-3 gap-px bg-ink-200 border border-ink-200"
      >
        {categories.map((c) => (
          <motion.div key={c.n} variants={item} className="bg-paper-050 p-8 flex flex-col group transition-colors hover:bg-paper-100">
            <IndexBracket n={c.n} />
            <div className="my-8 aspect-square relative overflow-hidden">
                <Image src={c.img} alt={c.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <h3 className="font-display text-4xl text-ink-950">{c.title}</h3>
            <div className="mt-auto pt-8">
                <Link href="/spaces" className="inline-block text-accent-500 font-bold underline decoration-2 underline-offset-4">Detail →</Link>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
