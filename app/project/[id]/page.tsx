import { Suspense } from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProjectDetails from "@/components/ProjectDetails"
import { Loader2 } from "lucide-react"

async function getProject(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
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
    })
    return project
  } catch (error) {
    console.error("Error fetching project:", error)
    return null
  }
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)

  if (!project) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ProjectDetails project={project} />
    </Suspense>
  )
}
