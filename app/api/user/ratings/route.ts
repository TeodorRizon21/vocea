import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req)
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all projects created by the user
    const userProjects = await prisma.project.findMany({
      where: {
        userId: clerkId,
      },
      select: {
        id: true,
      },
    })

    const projectIds = userProjects.map(project => project.id)

    // Get all ratings for the user's projects
    const ratings = await prisma.review.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            title: true,
          },
        },
      },
    })

    // Format the ratings for the frontend
    const formattedRatings = ratings.map(rating => ({
      id: rating.id,
      score: rating.score,
      comment: rating.comment,
      createdAt: rating.createdAt.toISOString(),
      fromUser: {
        firstName: rating.user.firstName || "Anonymous",
        lastName: rating.user.lastName || "",
      },
      project: {
        title: rating.project.title,
      },
    }))

    return NextResponse.json({ ratings: formattedRatings })
  } catch (error) {
    console.error("Error fetching user ratings:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
} 