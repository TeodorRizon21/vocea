"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import UserActivity from "@/components/UserActivity"
import UserProjectsList from "@/components/UserProjectsList"
import type { Project } from "@prisma/client"
import type { UserActivity as UserActivityType } from "@/types"
import { Star } from "lucide-react"
import { useUniversities } from "@/hooks/useUniversities"

interface User {
  firstName: string | null
  lastName: string | null
  university: string | null
  faculty: string | null
  city: string | null
  year: string | null
  avatar: string | null
  topics: Array<{
    id: string
    title: string
    createdAt: Date
    _count: {
      comments: number
    }
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: Date
    topic: {
      title: string
    }
  }>
  activity: UserActivityType
  projects: Project[]
  averageRating: number | null
  reviewCount: number
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { getUniversityName, getFacultyName } = useUniversities()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error("Failed to fetch user")
        }
        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error("Error fetching user:", error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) return null

  const initials = user.firstName && user.lastName ? `${user.firstName[0]}${user.lastName[0]}` : "?"
  const universityName = user.university ? getUniversityName(user.university) : "University not set"
  const facultyName = user.faculty && user.university ? getFacultyName(user.university, user.faculty) : null

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-8">
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {user.firstName} {user.lastName}
              </CardTitle>
              <p className="text-muted-foreground">
                {universityName}
                {facultyName && `, ${facultyName}`}
              </p>
              {user.city && user.year && (
                <p className="text-sm text-muted-foreground mt-1">
                  {user.city} • Year {user.year}
                </p>
              )}
            </div>

            {/* Display user rating */}
            {user.averageRating !== null && (
              <div className="ml-auto flex items-center">
                <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 mr-1" />
                  <span className="font-medium">{user.averageRating.toFixed(1)}</span>
                  <span className="text-sm ml-1">
                    ({user.reviewCount} {user.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Activity Stats */}
      <UserActivity activity={user.activity} />

      {/* User's Projects */}
      <UserProjectsList projects={user.projects} />

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Topics</h3>
          {user.topics && user.topics.length > 0 ? (
            <div className="space-y-4">
              {user.topics.map((topic) => (
                <Card key={topic.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{topic.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(topic.createdAt), "PPP 'at' HH:mm")}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">{topic._count.comments} comments</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground">No topics yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Comments</h3>
          {user.comments && user.comments.length > 0 ? (
            <div className="space-y-4">
              {user.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{comment.topic.title}</h4>
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(comment.createdAt), "PPP 'at' HH:mm")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground">No comments yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

