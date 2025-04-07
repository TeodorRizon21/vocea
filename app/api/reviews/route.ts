import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { projectId, score, comment } = await req.json()

    if (!projectId || !score || score < 1 || score > 5) {
      return new NextResponse("Invalid request data", { status: 400 })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Check if user is trying to review their own project
    if (project.userId === userId) {
      return new NextResponse("You cannot review your own project", { status: 400 })
    }

    // Check if user has already reviewed this project
    const existingReview = await prisma.review.findFirst({
      where: {
        projectId,
        userId,
      },
    })

    if (existingReview) {
      // Update existing review
      const updatedReview = await prisma.review.update({
        where: {
          id: existingReview.id,
        },
        data: {
          score,
          comment: comment || "",
        },
      })
      return NextResponse.json(updatedReview)
    }

    // Create new review
    const review = await prisma.review.create({
      data: {
        projectId,
        userId,
        score,
        comment: comment || "",
      },
    })

    // Create a notification for the project owner
    await prisma.notification.create({
      data: {
        userId: project.userId,
        type: "project_review",
        message: `Someone left a ${score}-star review on your project: ${project.title}`,
        read: false,
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error("Error creating review:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const userId = searchParams.get("userId")

    if (!projectId && !userId) {
      return new NextResponse("Missing projectId or userId parameter", { status: 400 })
    }

    const whereClause: any = {}
    if (projectId) whereClause.projectId = projectId
    if (userId) whereClause.userId = userId

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

