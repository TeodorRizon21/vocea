"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Star, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UserRating {
  id: string
  score: number
  comment: string
  createdAt: string
  fromUser: {
    firstName: string
    lastName: string
  }
  project: {
    title: string
  }
}

export default function UserRatings() {
  const [ratings, setRatings] = useState<UserRating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch("/api/user/ratings")
        if (!response.ok) {
          throw new Error("Failed to fetch ratings")
        }
        const data = await response.json()
        setRatings(data.ratings)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Error fetching ratings:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRatings()
  }, [])

  const displayedRatings = showAll ? ratings : ratings.slice(0, 3)

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading feedback: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        {ratings.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No feedback received yet</p>
        ) : (
          <div className="space-y-4">
            {displayedRatings.map((rating) => (
              <div key={rating.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-1" />
                    <span className="font-semibold">{rating.score.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mb-2">{rating.comment}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>From: {rating.fromUser.firstName} {rating.fromUser.lastName}</span>
                  <span>Project: {rating.project.title}</span>
                </div>
              </div>
            ))}
            {ratings.length > 3 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    View All Feedback
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 