"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import OnboardingDialog from "./OnboardingDialog"
import { usePathname } from "next/navigation"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const checkUserData = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`${window.location.origin}/api/user`)
        
        // If the response is 404 (user not found), show onboarding
        if (response.status === 404) {
          setShowOnboarding(true)
          setIsLoading(false)
          return
        }
        
        if (!response.ok) throw new Error("Failed to fetch user data")

        const userData = await response.json()
        const needsOnboarding = !userData?.university || !userData?.city || !userData?.year

        // Show onboarding if user is missing information and not already on dashboard
        setShowOnboarding(needsOnboarding && pathname !== "/dashboard")
      } catch (error) {
        console.error("Error checking user data:", error)
        // If there's an error fetching user data, show onboarding
        setShowOnboarding(true)
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded) {
      checkUserData()
    }
  }, [user, isLoaded, pathname])

  if (isLoading) return null

  return (
    <>
      {children}
      <OnboardingDialog
        isOpen={showOnboarding}
        onClose={() => {
          // Allow closing if there was an error with the API
          setShowOnboarding(false);
        }}
        onSubmit={async (data) => {
          try {
            console.log("Submitting onboarding data:", data);
            const response = await fetch(`${window.location.origin}/api/user/onboard`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            })

            if (!response.ok) {
              console.error("Failed to save user data:", await response.text());
              throw new Error("Failed to save user data")
            }

            const updatedUser = await response.json()
            console.log("Received user data:", updatedUser);
            if (updatedUser.isOnboarded) {
              setShowOnboarding(false)
            } else {
              console.error("User wasn't marked as onboarded");
              // Allow dialog to be closed anyway
              setShowOnboarding(false);
            }
          } catch (error) {
            console.error("Error during onboarding:", error)
            // Allow dialog to be closed if there's an error
            setShowOnboarding(false);
          }
        }}
      />
    </>
  )
}
