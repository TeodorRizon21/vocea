"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import UserProfile from "@/components/UserProfile"
import DashboardHero from "@/components/DashboardHero"
import ProfileInfo from "@/components/ProfileInfo"
import SubscriptionCards from "@/components/SubscriptionCards"
import ConfirmationDialog from "@/components/ConfirmationDialog"
import UserActivity from "@/components/UserActivity"
import OnboardingDialog from "@/components/OnboardingDialog"
import EditProfileDialog from "@/components/EditProfileDialog"
import UserProjects from "@/components/UserProjects"
import { useRouter } from "next/navigation"
import type { User } from "@/types"
import RatingCard from "@/components/RatingCard"

interface UserData extends User {
  firstName?: string
  lastName?: string
  activity?: {
    projectsCreated: number
    projectsJoined: number
    commentsPosted: number
    forumTopicsCreated: number
    recentComments: Array<{
      id: number
      content: string
      projectTitle: string
      topicId: string
    }>
  }
  averageRating: number | null
  reviewCount: number
}

export default function DashboardPage() {
  const { isLoaded } = useUser()
  const router = useRouter()
  const [selectedSubscription, setSelectedSubscription] = useState("Basic")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pendingSubscription, setPendingSubscription] = useState("")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const checkRequiredInformation = useCallback((data: UserData | null) => {
    return !data?.firstName || !data?.lastName || !data?.university || !data?.city || !data?.year
  }, [])

  const handleSubscriptionChange = (newSubscription: string) => {
    setPendingSubscription(newSubscription)
    setIsDialogOpen(true)
  }

  const confirmSubscriptionChange = async () => {
    setIsDialogOpen(false)
    setSelectedSubscription(pendingSubscription)

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription: pendingSubscription }),
      })

      if (!response.ok) {
        console.error("Failed to update subscription")
      }
    } catch (error) {
      console.error("Error updating subscription:", error)
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user")
        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }
        const data = await response.json()
        setUserData(data)

        // Check if user has all required information
        if (checkRequiredInformation(data)) {
          setShowOnboarding(true)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded) {
      fetchUserData()
    }
  }, [isLoaded, checkRequiredInformation])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const defaultActivity = {
    projectsCreated: 0,
    projectsJoined: 0,
    commentsPosted: 0,
    forumTopicsCreated: 0,
    recentComments: [] as Array<{
      id: number
      content: string
      projectTitle: string
      topicId: string
    }>,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">Dashboard</h1>
        <UserProfile membershipPlan={selectedSubscription} />
      </div>
      <DashboardHero name={userData?.firstName || "User"} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ProfileInfo
            firstName={userData?.firstName || "Not set"}
            lastName={userData?.lastName || "Not set"}
            university={userData?.university || "Not set"}
            faculty={userData?.faculty || "Not set"}
            city={userData?.city || "Not set"}
            year={userData?.year || "Not set"}
            reviewScore={userData?.averageRating ?? 0}
            onEdit={() => setShowEditProfile(true)}
          />
          <RatingCard averageRating={userData?.averageRating !== undefined ? userData.averageRating : null} reviewCount={userData?.reviewCount || 0} />
          <UserActivity activity={userData?.activity || defaultActivity} />
        </div>
        <div className="space-y-6">
          <UserProjects />
          <SubscriptionCards
            selectedSubscription={selectedSubscription}
            onSubscriptionChange={handleSubscriptionChange}
            className="text-gray-800 dark:text-gray-200"
          />
        </div>
      </div>
      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmSubscriptionChange}
        title="Change Subscription"
        message={`Are you sure you want to change your subscription to ${pendingSubscription}?`}
      />
      <OnboardingDialog
        isOpen={showOnboarding}
        onClose={() => {
          // Only allow closing if all required information is present
          if (!checkRequiredInformation(userData)) {
            setShowOnboarding(false)
          }
        }}
        onSubmit={async (data) => {
          try {
            const response = await fetch("/api/user/onboard", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            })
            if (response.ok) {
              const updatedUser = await response.json()
              setUserData(updatedUser)
              setShowOnboarding(false)
              router.refresh()
            }
          } catch (error) {
            console.error("Error during onboarding:", error)
          }
        }}
      />
      <EditProfileDialog
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        initialData={userData}
        onSave={async (data) => {
          try {
            const response = await fetch("/api/user", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                firstName: userData?.firstName,
                lastName: userData?.lastName,
                university: data.universityId, // Changed from data.university to data.universityId
                faculty: data.facultyId, // Changed from data.faculty to data.facultyId
                city: data.city,
                year: data.year,
              }),
            })
            if (response.ok) {
              const updatedData = await response.json()
              setUserData(updatedData)
              setShowEditProfile(false)
              // Check if all required information is now present
              if (checkRequiredInformation(updatedData)) {
                setShowOnboarding(true)
              }
            }
          } catch (error) {
            console.error("Error updating profile:", error)
          }
        }}
      />
    </div>
  )
}
