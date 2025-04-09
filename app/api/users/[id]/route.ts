import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Find the user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: params.id },
      include: {
        topics: {
          include: {
            _count: {
              select: { comments: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        comments: {
          include: {
            topic: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Get project count
    const projectCount = await prisma.project.count({
      where: {
        userId: params.id,
      },
    })

    // Get comment count
    const commentCount = await prisma.forumComment.count({
      where: {
        userId: params.id,
      },
    })

    // Get forum topics count
    const forumTopicsCount = await prisma.forumTopic.count({
      where: {
        userId: params.id,
      },
    })

    // Get recent comments with topic titles
    const recentComments = await prisma.forumComment.findMany({
      where: {
        userId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        topic: {
          select: {
            title: true,
          },
        },
      },
    })

    // Format recent comments for the frontend
    const formattedRecentComments = recentComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      projectTitle: comment.topic?.title || "Unknown Topic",
    }))

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: {
        userId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate average rating for the user's projects
    const projectReviews = await prisma.review.findMany({
      where: {
        project: {
          userId: params.id,
        },
      },
    })

    const totalScore = projectReviews.reduce((sum, review) => sum + review.score, 0)
    const averageRating = projectReviews.length > 0 ? totalScore / projectReviews.length : null
    const reviewCount = projectReviews.length

    // Combine all data
    const userData = {
      ...user,
      activity: {
        projectsCreated: projectCount,
        projectsJoined: 0, // Placeholder for future functionality
        commentsPosted: commentCount,
        forumTopicsCreated: forumTopicsCount,
        recentComments: formattedRecentComments,
      },
      projects: projects,
      averageRating,
      reviewCount,
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error("Error fetching user:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
