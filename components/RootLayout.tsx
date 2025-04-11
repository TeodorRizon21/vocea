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
            console.log("Submitting onboarding data from RootLayout:", data);
            console.log("University:", data.university);
            console.log("Faculty:", data.faculty);
            
            // Ensure the data structure is correct for the API
            if (!data.university || !data.faculty) {
              console.error("Missing university or faculty name in data:", data);
              alert("Missing university or faculty information. Please try again.");
              return;
            }
            
            const response = await fetch(`${window.location.origin}/api/user/onboard`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                firstName: data.firstName,
                lastName: data.lastName,
                universityId: data.universityId,
                facultyId: data.facultyId,
                university: data.university, // Ensure this is being sent explicitly
                faculty: data.faculty,       // Ensure this is being sent explicitly
                city: data.city,
                year: data.year
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("Failed to save user data:", errorText);
              throw new Error(`Failed to save user data: ${errorText}`);
            }

            const updatedUser = await response.json();
            console.log("Received user data after onboarding:", updatedUser);
            
            // Verify that university and faculty were saved
            if (!updatedUser.university || !updatedUser.faculty) {
              console.error("University or faculty missing in saved user data:", updatedUser);
              alert("There was an issue saving your university and faculty information. Please try again.");
              return;
            }
            
            if (updatedUser.isOnboarded) {
              console.log("User successfully onboarded with university:", updatedUser.university, "and faculty:", updatedUser.faculty);
              setShowOnboarding(false);
            } else {
              console.error("User wasn't marked as onboarded");
              // Allow dialog to be closed anyway
              setShowOnboarding(false);
            }
          } catch (error) {
            console.error("Error during onboarding:", error);
            alert("There was an error saving your information. Please try again.");
            // Allow dialog to be closed if there's an error
            setShowOnboarding(false);
          }
        }}
      />
    </>
  )
}
