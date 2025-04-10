"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import BrowsePageClient from "@/components/BrowsePageClient"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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

// Add this type definition based on the expected project structure
interface ExtendedProject {
  id: string
  type: string
  title: string
  description: string
  subject: string
  category: string
  university: string
  faculty: string
  phoneNumber: string
  images: string[]
  userId: string
  authorName: string | null
  authorAvatar: string | null
  createdAt: Date
  updatedAt: Date
  user: {
    firstName: string | null
    lastName: string | null
    university: string | null
    faculty: string | null
    avatar: string | null
  }
  reviews: Array<{ score: number }>
}

interface BrowsePageWrapperProps {
  initialTab: string
}

export default function BrowsePageWrapper({ initialTab }: BrowsePageWrapperProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<ExtendedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isMounted = true;
    
    async function fetchProjects() {
      if (!isMounted) return;
      
      try {
        setLoading(true)
        setError(null)
        
        console.log(`Fetching projects for tab: ${initialTab} (attempt ${retryCount + 1})`)
        
        const response = await fetch(`/api/projects?type=${initialTab}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (isMounted) {
          if (data.projects && Array.isArray(data.projects)) {
            console.log(`Received ${data.projects.length} projects from API`)
            setProjects(data.projects)
          } else if (Array.isArray(data)) {
            console.log(`Received ${data.length} projects from API`)
            setProjects(data)
          } else {
            console.error("Invalid data format received:", data)
            throw new Error("Invalid data format received from API")
          }
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err)
        if (isMounted) {
          setError(`Failed to load projects: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProjects()
    
    return () => {
      isMounted = false;
    }
  }, [initialTab, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-gray-500">Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleRetry} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // If no projects are found, render a message but still show the UI
  if (projects.length === 0) {
    return (
      <BrowsePageClient 
        tabsData={tabsData} 
        initialTab={initialTab} 
        projects={[]} 
      />
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