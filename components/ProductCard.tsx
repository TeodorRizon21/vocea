"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ProductCardProps {
  title: string
  subject: string
  thumbnailUrl: string
  authorFirstName?: string | null
  authorLastName?: string | null
  authorAvatar?: string | null
  university: string
  faculty: string
  reviews: Array<{ score: number }>
  userId: string // Added userId prop
}

export default function ProductCard({
  title,
  subject,
  thumbnailUrl,
  authorFirstName,
  authorLastName,
  authorAvatar,
  university,
  faculty,
  reviews,
  userId, // Added userId parameter
}: ProductCardProps) {
  const averageScore =
    reviews.length > 0 ? reviews.reduce((acc, review) => acc + review.score, 0) / reviews.length : null

  const displayName = authorFirstName && authorLastName ? `${authorFirstName} ${authorLastName}` : "Anonymous"

  const initials = authorFirstName && authorLastName ? `${authorFirstName[0]}${authorLastName[0]}` : "?"

  return (
    <Card className="h-full flex flex-col shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative w-full h-64">
        <Image src={thumbnailUrl || "/placeholder.svg"} alt={title} fill style={{ objectFit: "contain" }} />

        {/* Rating badge in top-right corner */}
        {averageScore !== null && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
              {averageScore.toFixed(1)} ({reviews.length})
            </Badge>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-1">{subject}</p>
      </CardHeader>
      <CardContent className="flex items-center mt-auto">
        {/* Make the avatar and name clickable */}
        <Link href={`/profile/${userId}`} className="flex items-center group" onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-8 w-8 mr-2 group-hover:ring-2 group-hover:ring-purple-400 transition-all">
            <AvatarImage src={authorAvatar || undefined} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate group-hover:text-purple-600 transition-colors">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{university || "University not set"}</p>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

