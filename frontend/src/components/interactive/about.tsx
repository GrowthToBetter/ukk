'use client'

export function About() {
  return (
    <section id="about" className="min-h-screen bg-paper-100 p-6 pt-24 grid md:grid-cols-2 gap-12">
      <h2 className="font-display text-fs-h2 leading-tight">
        Your vision,<br />
        <span className="text-accent-500">our expertise.</span>
      </h2>
      <div className="font-body text-fs-body leading-relaxed space-y-4 pt-4">
        <p>
          We build digital experiences that are not just functioning, but <span className="underline decoration-accent-500 underline-offset-4 cursor-pointer hover:text-accent-500">thoughtfully crafted</span>. 
          Every pixel is placed with intent, ensuring your brand stands out in a crowded digital landscape.
        </p>
        <p>
          Our process is built on clarity and collaboration, turning complex ideas into 
          <span className="underline decoration-accent-500 underline-offset-4 cursor-pointer hover:text-accent-500"> intuitive solutions</span>. 
          We believe in the power of less and the precision of more.
        </p>
      </div>
    </section>
  )
}
