interface HeroSectionProps {
  title: string
  description: string
}

export default function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white p-8 rounded-lg">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p>{description}</p>
    </div>
  )
}

