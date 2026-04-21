type SectionCardProps = {
  title: string
  children: React.ReactNode
}

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="section-card">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export default SectionCard