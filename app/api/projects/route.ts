import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // First, get the user from the database to ensure we have their information
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has completed their profile in our database
    if (!user.firstName || !user.lastName) {
      return NextResponse.json(
        { error: "Please complete your profile before creating a project" },
        { status: 400 }
      )
    }

    // Validate phone number
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(data.phoneNumber)) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits" },
        { status: 400 }
      )
    }

    // Validate required fields
    const requiredFields = [
      "type",
      "title",
      "description",
      "subject",
      "category",
      "university",
      "faculty",
      "phoneNumber",
    ]
    const missingFields = requiredFields.filter((field) => !data[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          fields: missingFields,
        },
        { status: 400 }
      )
    }

    // Validate images for non-request projects
    if (data.type !== "cerere" && (!data.images || data.images.length === 0)) {
      return NextResponse.json(
        { error: "At least one image is required for this project type" },
        { status: 400 }
      )
    }

    // Validate image count
    if (data.images && data.images.length > 4) {
      return NextResponse.json(
        { error: "Maximum of 4 images allowed" },
        { status: 400 }
      )
    }

    // Remove fields that are not in the Prisma schema
    const { universityId, facultyId, city, ...projectData } = data

    const project = await prisma.project.create({
      data: {
        ...projectData,
        userId: user.clerkId,
        authorName: `${user.firstName} ${user.lastName}`,
        authorAvatar: user.avatar || null,
        images: data.images || [],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            university: true,
            faculty: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

