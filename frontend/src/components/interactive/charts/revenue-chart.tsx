'use client'
import { motion } from 'motion/react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export function RevenueChart({ data }: { data: { day: string; total: number }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="border border-ink-200 bg-paper-050 p-8 relative"
    >
      {/* Crop-marks */}
      {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute ${pos} z-10 h-3 w-3 border-accent-500`}
          style={{ 
             borderTop: pos.includes('top') ? '1px solid currentColor' : 'none',
             borderBottom: pos.includes('bottom') ? '1px solid currentColor' : 'none',
             borderLeft: pos.includes('left') ? '1px solid currentColor' : 'none',
             borderRight: pos.includes('right') ? '1px solid currentColor' : 'none',
          }}
        />
      ))}
      <span className="font-mono text-fs-index text-ink-600 block mb-6">[09] Pendapatan per hari</span>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="day" stroke="var(--color-ink-600)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--color-paper-050)', border: '1px solid var(--color-ink-200)', borderRadius: 0 }}
            cursor={{ stroke: 'var(--color-ink-600)', strokeWidth: 1 }}
          />
          <Line type="monotone" dataKey="total" stroke="var(--color-accent-500)" strokeWidth={2}
                dot={false} isAnimationActive animationDuration={900} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
