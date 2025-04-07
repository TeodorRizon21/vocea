"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { generateAcronym } from "@/lib/acronym"
import { useUniversities } from "@/hooks/useUniversities"

interface UserProfileProps {
  membershipPlan?: string
  className?: string
}

interface UserData {
  firstName?: string
  lastName?: string
  avatar?: string
  university?: string
  faculty?: string
}

export default function UserProfile({ membershipPlan = "Basic", className }: UserProfileProps) {
  const { isLoaded, user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [error, setError] = useState(false)
  const router = useRouter()
  const { getUniversityName, getFacultyName } = useUniversities()

  // Set up useEffect to fetch user data from the API
  useEffect(() => {
    setMounted(true)
    // Fetch user data from your API
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user")
        if (response.ok) {
          const data = await response.json()
          setUserData(data)
        } else {
          // If API returns an error, use Clerk data as fallback
          if (user) {
            setUserData({
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              avatar: user.imageUrl || undefined,
              university: "University not set",
              faculty: "Faculty not set",
            })
          }
          setError(true)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError(true)
        // Use Clerk data as fallback
        if (user) {
          setUserData({
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            avatar: user.imageUrl || undefined,
            university: "University not set",
            faculty: "Faculty not set",
          })
        }
      }
    }
    fetchUserData()
  }, [user])

  // Don't render anything until the component is mounted and Clerk is loaded
  if (!mounted || !isLoaded) {
    return null
  }

  // If no user data is available, show the last available user data instead of "Guest User"
  const displayUserData = userData || {
    firstName: user?.firstName,
    lastName: user?.lastName,
    avatar: user?.imageUrl,
    university: "University not set",
    faculty: "Faculty not set",
  }

  // Convert IDs to actual names
  const universityName = displayUserData.university && displayUserData.university !== "University not set"
    ? getUniversityName(displayUserData.university)
    : "University not set"

  const facultyName = displayUserData.faculty && displayUserData.faculty !== "Faculty not set"
    ? getFacultyName(displayUserData.university || "", displayUserData.faculty)
    : "Faculty not set"

  const initials = displayUserData.firstName && displayUserData.lastName
    ? `${displayUserData.firstName[0]}${displayUserData.lastName[0]}`
    : "?"
  const displayName = displayUserData.firstName && displayUserData.lastName
    ? `${displayUserData.firstName} ${displayUserData.lastName}`
    : "Profile Incomplete"

  return (
    <div
      className={`flex items-center space-x-4 ${className} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition duration-200 ease-in-out`}
      onClick={() => router.push("/dashboard")}
      role="button"
      tabIndex={0}
      aria-label="Go to dashboard"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push("/dashboard")
        }
      }}
    >
      <Avatar className="w-12 h-12 border-2 border-purple-600 dark:border-purple-400">
        <AvatarImage src={displayUserData.avatar} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold">{displayName}</p>
        <p
          className="text-sm text-gray-500 dark:text-gray-400"
          title={
            facultyName && universityName
              ? `${facultyName}, ${universityName}`
              : "University not set"
          }
        >
          {facultyName && universityName
            ? `${generateAcronym(facultyName)}, ${generateAcronym(universityName)}`
            : "University not set"}
        </p>
        <Badge
          variant="secondary"
          className={`mt-1 ${
            membershipPlan === "Basic"
              ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              : membershipPlan === "Premium"
              ? "bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200"
              : membershipPlan === "Gold"
              ? "bg-yellow-200 text-yellow-800"
              : ""
          }`}
        >
          {membershipPlan} plan
        </Badge>
      </div>
    </div>
  )
}

