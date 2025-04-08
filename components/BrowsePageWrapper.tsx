"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import BrowsePageClient from "@/components/BrowsePageClient"
import { Loader2 } from "lucide-react"

interface BrowsePageWrapperProps {
  initialTab: string
}

const tabsData = [
  {
    id: "proiect",
    label: "Proiect",
    description: "Browse all projects",
  },
  {
    id: "licenta",
    label: "Licenta",
    description: "Browse all bachelor's theses",
  },
  {
    id: "disertatie",
    label: "Disertatie",
    description: "Browse all master's theses",
  },
]

export default function BrowsePageWrapper({ initialTab }: BrowsePageWrapperProps) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/projects?type=${initialTab || ""}`)
        if (!response.ok) {
          throw new Error("Failed to fetch projects")
        }
        const data = await response.json()
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [initialTab])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <BrowsePageClient
      tabsData={tabsData}
      initialTab={initialTab}
      projects={projects}
    />
  )
} 