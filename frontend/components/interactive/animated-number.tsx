"use client"
import { motion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

export function AnimatedNumber({ value, isCurrency }: { value: number; isCurrency?: boolean }) {
  const spring = useSpring(0, { stiffness: 120, damping: 20 })
  const display = useTransform(spring, (v) =>
    Math.round(v).toLocaleString('id-ID', isCurrency ? { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 } : {})
  )
  useEffect(() => { spring.set(value) }, [value, spring])
  return <motion.span className="tabular-nums font-display">{display}</motion.span>
}