"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useUniversities } from "@/hooks/useUniversities"

interface UserTooltipProps {
  userId: string
  firstName: string | null
  lastName: string | null
  university: string | null
  faculty: string | null
  avatar?: string | null
  children: React.ReactNode
}

export default function UserTooltip({
  userId,
  firstName,
  lastName,
  university,
  faculty,
  avatar,
  children,
}: UserTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}` : "?"
  const { getUniversityName, getFacultyName } = useUniversities()
  
  // Get the university and faculty names
  const universityName = university ? getUniversityName(university) : null
  const facultyName = university && faculty ? getFacultyName(university, faculty) : null

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link href={`/profile/${userId}`} className="hover:opacity-80 transition-opacity">
        {children}
      </Link>

      {showTooltip && (
        <div className="absolute z-50 left-full ml-2 top-0">
          <Card className="w-64 border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={avatar || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {firstName} {lastName}
                  </p>
                  {universityName && <p className="text-xs text-muted-foreground">{universityName}</p>}
                  {facultyName && <p className="text-xs text-muted-foreground">{facultyName}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

