"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

interface RatingCardProps {
  averageRating: number | null
  reviewCount: number
}

export default function RatingCard({ averageRating, reviewCount }: RatingCardProps) {
  // Ensure averageRating is a valid number before using toFixed
  const formattedRating = averageRating !== null && !isNaN(averageRating) 
    ? Number(averageRating).toFixed(1) 
    : null;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>User Rating</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        {formattedRating !== null ? (
          <div className="flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-1" />
            <span className="text-2xl font-semibold">{formattedRating}</span>
            <span className="text-muted-foreground ml-2">({reviewCount} reviews)</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No ratings yet</span>
        )}
      </CardContent>
    </Card>
  )
}

