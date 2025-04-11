"use client"

import Link from "next/link"
import ProductCard from "./ProductCard"
import type { Project } from "@prisma/client"
import { useUniversities } from "@/hooks/useUniversities"

interface ExtendedProject extends Project {
  user: {
    firstName: string | null
    lastName: string | null
    university: string | null
    faculty: string | null
    avatar: string | null
  }
  reviews: Array<{ score: number }>
}

interface ProductGridProps {
  projects: ExtendedProject[]
}

export default function ProductGrid({ projects }: ProductGridProps) {
  const { getUniversityName, getFacultyName } = useUniversities()

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No projects found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        // Get university and faculty names, fallback to direct values if lookup fails
        const universityName = getUniversityName(project.university || "") || project.university || "University not set";
        const facultyName = getFacultyName(project.university || "", project.faculty || "") || project.faculty || "Faculty not set";
        
        return (
          <Link key={project.id} href={`/project/${project.id}`} className="block h-full">
            <ProductCard
              title={project.title}
              subject={project.subject}
              thumbnailUrl={project.images[0] || "/placeholder.svg?height=192&width=192"}
              authorFirstName={project.user.firstName}
              authorLastName={project.user.lastName}
              authorAvatar={project.user.avatar}
              university={universityName}
              faculty={facultyName}
              category={project.category}
              reviews={project.reviews}
              userId={project.userId}
            />
          </Link>
        );
      })}
    </div>
  )
}

