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
  const { getUniversityName, getFacultyName, universities } = useUniversities()

  // Add console logging for debugging
  console.log("ProfileInfo received university:", university);
  console.log("ProfileInfo received faculty:", faculty);

  // Check if the university value is an ID or a name
  const isUniversityId = university?.startsWith('uni_');
  const isFacultyId = faculty?.startsWith('fac_');
  
  console.log("Is university ID?", isUniversityId);
  console.log("Is faculty ID?", isFacultyId);
  
  // If it's an ID, use the lookup function; otherwise, display the name directly
  const universityDisplay = 
    !university || university === "University not set" 
      ? "University not set"
      : isUniversityId 
        ? getUniversityName(university) || university
        : university;

  const facultyDisplay = 
    !faculty || faculty === "Faculty not set" 
      ? "Faculty not set"
      : isFacultyId
        ? getFacultyName(university || "", faculty) || faculty
        : faculty;
        
  console.log("Final university display:", universityDisplay);
  console.log("Final faculty display:", facultyDisplay);

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
          <span>{universityDisplay}</span>
        </div>
        <div className="flex items-center">
          <School className="mr-2 h-4 w-4 text-purple-600" />
          <span>{facultyDisplay}</span>
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
