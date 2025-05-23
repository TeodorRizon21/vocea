import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const maxDuration = 60 // Set maximum duration to 60 seconds (Vercel Hobby plan limit)
export const dynamic = 'force-dynamic' // Ensure the route is dynamic

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req)
    
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Split the transaction into smaller chunks to improve performance
    const [user, activityCounts] = await Promise.all([
      // Get user data
      prisma.user.findUnique({
        where: { clerkId }
      }),
      // Get all counts in a single transaction
      prisma.$transaction([
        prisma.project.count({ where: { userId: clerkId } }),
        prisma.forumTopic.count({ where: { userId: clerkId } }),
        prisma.forumComment.count({ where: { userId: clerkId } })
      ])
    ])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const [projectCount, forumTopicsCount, commentCount] = activityCounts

    // Get recent activity data in parallel
    const [recentComments, projectReviews] = await Promise.all([
      prisma.forumComment.findMany({
        where: { userId: clerkId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          topic: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.review.findMany({
        where: {
          project: { userId: clerkId }
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
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    ])

    const formattedRecentComments = recentComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      projectTitle: comment.topic?.title || "Unknown Topic",
      topicId: comment.topic?.id || "",
    }))

    const totalScore = projectReviews.reduce((sum, review) => sum + review.score, 0)
    const averageRating = projectReviews.length > 0 ? totalScore / projectReviews.length : null
    const reviewCount = projectReviews.length

    const formattedReviews = projectReviews.map(review => ({
      id: review.id,
      score: review.score,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      user: {
        firstName: review.user.firstName,
        lastName: review.user.lastName,
      },
      project: {
        id: review.project.id,
        title: review.project.title,
      }
    }))

    const userData = {
      ...user,
      activity: {
        projectsCreated: projectCount,
        projectsJoined: 0,
        commentsPosted: commentCount,
        forumTopicsCreated: forumTopicsCount,
        recentComments: formattedRecentComments,
      },
      averageRating,
      reviewCount,
      reviews: formattedReviews,
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error("Error fetching user activity:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    const updatedUser = await prisma.user.upsert({
      where: {
        clerkId: userId,
      },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        university: data.university,
        faculty: data.faculty,
        city: data.city,
        year: data.year,
      },
      create: {
        clerkId: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        university: data.university,
        faculty: data.faculty,
        city: data.city,
        year: data.year,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
