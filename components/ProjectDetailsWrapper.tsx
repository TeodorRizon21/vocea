"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProjectDetails from "@/components/ProjectDetails"
import { Loader2 } from "lucide-react"

interface ProjectDetailsWrapperProps {
  projectId: string
}

export default function ProjectDetailsWrapper({ projectId }: ProjectDetailsWrapperProps) {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${projectId}`)
        
        if (response.status === 404) {
          router.push('/404')
          return
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setProject(data)
      } catch (error) {
        console.error("Error fetching project:", error)
        setError("Failed to load project")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
        {error}
      </div>
    )
  }

  if (!project) {
    router.push('/404')
    return null
  }

  return <ProjectDetails project={project} />
} 