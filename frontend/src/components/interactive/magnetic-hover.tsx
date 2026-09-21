'use client'
import { motion } from 'motion/react'

export function MagneticHover({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
        whileHover={{ x: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className={className}
    >
        {children}
    </motion.div>
  )
}
