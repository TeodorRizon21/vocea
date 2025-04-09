"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { School, MapPin, Calendar, Star, Edit } from "lucide-react"
import { useUniversities } from "@/hooks/useUniversities"

interface ProfileInfoProps {
  firstName: string
  lastName: string
  university: string
  faculty: string
  city: string
  year: string
  reviewScore: number
  onEdit: () => void
}

export default function ProfileInfo({
  firstName,
  lastName,
  university,
  faculty,
  city,
  year,
  reviewScore,
  onEdit,
}: ProfileInfoProps) {
  const { getUniversityName, getFacultyName } = useUniversities()

  // Convert IDs to actual names
  const universityName =
    university && university !== "University not set" ? getUniversityName(university) : "University not set"

  const facultyName =
    faculty && faculty !== "Faculty not set" ? getFacultyName(university || "", faculty) : "Faculty not set"

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Profile</CardTitle>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center">
          <School className="mr-2 h-4 w-4 text-purple-600" />
          <span>
            {firstName} {lastName}
          </span>
        </div>
        <div className="flex items-center">
          <School className="mr-2 h-4 w-4 text-purple-600" />
          <span>{universityName}</span>
        </div>
        <div className="flex items-center">
          <School className="mr-2 h-4 w-4 text-purple-600" />
          <span>{facultyName}</span>
        </div>
        <div className="flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-purple-600" />
          <span>{city}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-purple-600" />
          <span>{year}</span>
        </div>
        {/*<div className="flex items-center">
          <Star className="mr-2 h-4 w-4 text-purple-600" />
          <span>Review Score: {reviewScore}</span>
        </div>
        */}
      </CardContent>
    </Card>
  )
}
