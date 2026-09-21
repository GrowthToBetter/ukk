'use client'
import { WhatIDoRow } from './what-i-do-row'

const items = [
  { index: '01', title: 'Web Development', detail: 'Crafting responsive and performant websites.' },
  { index: '02', title: 'UI/UX Design', detail: 'Designing intuitive and aesthetic user interfaces.' },
  { index: '03', title: 'Brand Strategy', detail: 'Building strong and cohesive brand identities.' },
  { index: '04', title: 'Digital Marketing', detail: 'Driving growth through data-driven campaigns.' },
]

export function WhatIDo() {
  return (
    <section id="what-i-do" className="min-h-screen bg-accent-900 p-6 pt-24">
      {items.map((item) => (
        <WhatIDoRow key={item.index} {...item} />
      ))}
    </section>
  )
}
