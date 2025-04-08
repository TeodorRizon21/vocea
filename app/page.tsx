import UserProfile from "@/components/UserProfile"
import NewsCarousel from "@/components/NewsCarousel"
import AboutUs from "@/components/AboutUs"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import NewsList from "@/components/NewsList"

export default function Home() {
  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">Vocea campusului</h1>
        <UserProfile membershipPlan="Basic" />
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Latest News</h2>
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }>
          <NewsList />
        </Suspense>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">About Us</h2>
        <AboutUs />
      </section>
    </div>
  )
}

