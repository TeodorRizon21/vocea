import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()
    console.log("Creating project with data:", data)

    // First, get the user from the database to ensure we have their information
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Check if user has completed their profile in our database
    if (!user.firstName || !user.lastName) {
      return new NextResponse(JSON.stringify({ error: "Please complete your profile before creating a project" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate phone number
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(data.phoneNumber)) {
      return new NextResponse(JSON.stringify({ error: "Phone number must be exactly 10 digits" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
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
      return new NextResponse(
        JSON.stringify({
          error: "Missing required fields",
          fields: missingFields,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Validate images for non-request projects
    if (data.type !== "cerere" && (!data.images || data.images.length === 0)) {
      return new NextResponse(JSON.stringify({ error: "At least one image is required for this project type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate image count
    if (data.images && data.images.length > 4) {
      return new NextResponse(JSON.stringify({ error: "Maximum of 4 images allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
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

    console.log("Created project with user data:", project)

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return new NextResponse(
      JSON.stringify({
        error: "Failed to create project",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

