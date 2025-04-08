import UserProfile from "@/components/UserProfile"
import BrowsePageClient from "@/components/BrowsePageClient"

const tabsData = [
  {
    id: "proiect",
    label: "Proiecte",
    description: "Explore ongoing projects and opportunities for collaboration.",
  },
  {
    id: "cerere",
    label: "Cereri de proiecte",
    description: "Browse project requests and find ways to contribute your skills.",
  },
  {
    id: "diverse",
    label: "Diverse",
    description: "Discover a variety of other opportunities and resources.",
  },
]

async function getProjects(type?: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/projects?type=${type || ""}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.projects
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const activeTab = (searchParams.tab as string) || "proiect"
  const projects = await getProjects(activeTab)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">Browse projects</h1>
        <UserProfile membershipPlan="Basic" />
      </div>

      <BrowsePageClient
        tabsData={tabsData}
        initialTab={activeTab}
        projects={projects}
      />
    </div>
  )
}

