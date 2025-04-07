import { format } from "date-fns"

interface DashboardHeroProps {
  name: string
}

export default function DashboardHero({ name }: DashboardHeroProps) {
  const today = format(new Date(), "MMMM d, yyyy")
  const displayName = name || "Guest"

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white p-8 rounded-lg">
      <p className="text-sm mb-4">{today}</p>
      <h2 className="text-3xl font-bold">Welcome back, {displayName}!</h2>
    </div>
  )
}

