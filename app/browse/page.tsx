import { prisma } from "@/lib/prisma"
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
    console.log("Fetching projects with type:", type)

    const projects = await prisma.project.findMany({
      where: type
        ? {
            type: type,
          }
        : undefined,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            university: true,
            faculty: true,
            avatar: true,
          },
        },
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`Found ${projects.length} projects`)
    return projects
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

      <BrowsePageClient tabsData={tabsData} initialTab={activeTab} projects={projects} />
    </div>
  )
}

