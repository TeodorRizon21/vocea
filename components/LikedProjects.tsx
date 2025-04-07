"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Calendar } from "lucide-react"

interface LikedProject {
  id: string
  title: string
  type: string
  category: string
  university: string
  faculty: string
  createdAt: string
  images: string[]
  likedAt: string
}

export default function LikedProjects() {
  const [likedProjects, setLikedProjects] = useState<LikedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLikedProjects = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/projects/liked")
        if (response.ok) {
          const data = await response.json()
          setLikedProjects(data)
        }
      } catch (error) {
        console.error("Error fetching liked projects:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLikedProjects()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liked Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Heart className="h-5 w-5 mr-2 text-red-500" />
          Liked Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        {likedProjects.length > 0 ? (
          <div className="space-y-4">
            {likedProjects.map((project) => (
              <Link href={`/project/${project.id}`} key={project.id}>
                <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start gap-4">
                    {project.images && project.images.length > 0 ? (
                      <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                        <Image
                          src={project.images[0] || "/placeholder.svg"}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-200 dark:bg-gray-700 h-16 w-16 flex-shrink-0 rounded-md flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium line-clamp-1">{project.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {project.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {project.type === "cerere" ? "Request" : project.type === "diverse" ? "Diverse" : "Project"}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Liked on {formatDate(project.likedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>You haven't liked any projects yet</p>
            <p className="text-sm mt-1">Browse projects and click the "Like" button to add them to this list</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

