import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      console.error("Unauthorized: No userId found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { firstName, lastName, university, faculty, city, year } = await req.json()

    // Validate required fields
    if (!firstName || !lastName || !university || !faculty || !city || !year) {
      console.error("Missing required fields:", { firstName, lastName, university, faculty, city, year })
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate name fields are not empty strings after trimming
    if (!firstName.trim() || !lastName.trim()) {
      return NextResponse.json(
        { error: "First name and last name cannot be empty" },
        { status: 400 }
      )
    }

    console.log("Attempting to update user with data:", {
      clerkId: userId,
      firstName,
      lastName,
      university,
      faculty,
      city,
      year,
    })

    // First try to update the existing user
    try {
      const updatedUser = await prisma.user.update({
        where: {
          clerkId: userId,
        },
        data: {
          firstName,
          lastName,
          university,
          faculty,
          city,
          year,
          isOnboarded: true,
        },
      })

      console.log("Successfully updated user:", updatedUser)
      return NextResponse.json(updatedUser)
    } catch (updateError: any) {
      // If update fails because user doesn't exist, create new user
      if (updateError.code === "P2025") {
        const newUser = await prisma.user.create({
          data: {
            clerkId: userId,
            firstName,
            lastName,
            university,
            faculty,
            city,
            year,
            isOnboarded: true,
          },
        })

        console.log("Successfully created new user:", newUser)
        return NextResponse.json(newUser)
      }

      // If it's a different error, throw it
      throw updateError
    }
  } catch (error) {
    console.error("Error in onboarding:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

