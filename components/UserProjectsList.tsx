import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import type { Project } from "@prisma/client"

interface UserProjectsListProps {
  projects: Project[]
}

export default function UserProjectsList({ projects }: UserProjectsListProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This user hasn't created any projects yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <Link href={`/project/${project.id}`} key={project.id} className="block">
              <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="relative w-16 h-16 rounded-md overflow-hidden">
                  <Image
                    src={project.images[0] || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.type.charAt(0).toUpperCase() + project.type.slice(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

