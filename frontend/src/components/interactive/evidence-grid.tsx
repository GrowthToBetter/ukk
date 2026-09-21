'use client'
import { motion } from 'motion/react'
import { useMagneticHover } from '@/hooks/use-magnetic-hover'

interface Project {
  index: string
  title: string
  year: string
  image: string
  aspectRatio: string
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function ProjectCard({ project }: { project: Project }) {
  const { ref, onMouseMove, onMouseLeave } = useMagneticHover()

  return (
    <motion.article 
      ref={ref as React.RefObject<HTMLElement>}
      onMouseMove={onMouseMove as unknown as React.MouseEventHandler<HTMLElement>}
      onMouseLeave={onMouseLeave as unknown as React.MouseEventHandler<HTMLElement>}
      variants={item} 
      className="border border-ink-200 bg-ink-950 p-4"
    >
      <span className="tabular-nums text-fs-index text-accent-050/70">
        [{project.index}] · {project.year}
      </span>
      <div 
        className="my-4 bg-ink-600" 
        style={{ aspectRatio: project.aspectRatio }}
      />
      <h3 className="font-display text-paper-100 text-2xl">{project.title}</h3>
    </motion.article>
  )
}

export function EvidenceGrid({ projects }: { projects: Project[] }) {
  return (
    <section id="evidence" className="min-h-screen bg-ink-950 p-6 pt-24">
      <h2 className="text-4xl font-display text-paper-100 mb-12">Evidence</h2>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {projects.map((p) => (
          <ProjectCard key={p.index} project={p} />
        ))}
      </motion.div>
    </section>
  )
}
