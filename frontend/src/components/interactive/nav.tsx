'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'

const navItems = [
  { href: '#hero', label: 'Beranda' },
  { href: '#stats', label: 'Statistik' },
  { href: '#pilihan-space', label: 'Space' },
  { href: '#big-statement', label: 'Value' },
  { href: '#how-it-works', label: 'Alur' },
  { href: '#kontak', label: 'Kontak' }
]

export function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setIsOpen(false)
    const lenis = (window as unknown as { lenis?: { scrollTo: (path: string, options: Record<string, unknown>) => void } }).lenis
    if (lenis) {
      lenis.scrollTo(`#${id}`, { offset: -72 })
    }
    history.pushState(null, '', `#${id}`)
  }

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-paper-100 border-b border-ink-200 text-ink-950' : 'bg-transparent text-ink-950'}`}>
      <div className="flex items-center justify-between p-6">
        <Link href="/" className="font-display text-xl font-bold">SpaceBooking</Link>
        
        <div className="hidden md:flex items-center gap-8 text-fs-index tabular-nums">
          {navItems.map((item, i) => (
            <a key={item.href} href={item.href} onClick={(e) => handleNavClick(e, item.href.replace('#', ''))} className="hover:text-accent-500 transition-colors">
              [{String(i + 1).padStart(2, '0')}] {item.label}
            </a>
          ))}
          <div className="h-4 w-px bg-ink-950/20" />
          <Link href="/spaces" className="hover:text-accent-500 transition-colors">[07] Katalog Space</Link>
          <Link href="/login" className={`px-4 py-2 font-bold border transition-colors ${isScrolled ? 'border-ink-200 hover:bg-ink-100' : 'border-ink-950/50 hover:bg-ink-950/10'}`}>Masuk</Link>
          <Link href="/register/member" className="bg-accent-500 text-paper-100 px-4 py-2 font-bold hover:bg-accent-500/90 transition-colors">Daftar</Link>
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden font-mono text-fs-index">
          [{isOpen ? 'CLOSE' : 'MENU'}]
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-950 text-paper-100 p-6 flex flex-col justify-center gap-6"
          >
            {navItems.map((item, i) => (
              <a key={item.href} href={item.href} onClick={(e) => handleNavClick(e, item.href.replace('#', ''))} className="font-display text-4xl">
                [{String(i + 1).padStart(2, '0')}] {item.label}
              </a>
            ))}
             <Link href="/spaces" className="font-display text-4xl">[07] Katalog Space</Link>
             <Link href="/login" className="font-display text-4xl text-accent-500">Masuk</Link>
             <Link href="/register/member" className="font-display text-4xl text-accent-500">Daftar</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
