import UserProfile from "@/components/UserProfile"
import BrowsePageWrapper from "@/components/BrowsePageWrapper"

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
    console.log("Fetching projects with type:", type)
    const response = await fetch(`/api/projects?type=${type || ""}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Found ${data.projects.length} projects`)
    return data.projects
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

export default function BrowsePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const activeTab = (searchParams.tab as string) || "proiect"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">Browse projects</h1>
        <UserProfile membershipPlan="Basic" />
      </div>

      <BrowsePageWrapper initialTab={activeTab} />
    </div>
  )
}

