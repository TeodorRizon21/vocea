import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req)
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Find the user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    console.log("Found user:", user.id, user.email)

    // IMPORTANT: According to the schema, userId in Project, ForumTopic, and ForumComment
    // references the clerkId, not the MongoDB ObjectId

    // Get project count - using clerkId
    const projectCount = await prisma.project.count({
      where: {
        userId: clerkId, // Use clerkId, not user.id
      },
    })
    console.log("Project count:", projectCount)

    // Get forum topics count - using clerkId
    const forumTopicsCount = await prisma.forumTopic.count({
      where: {
        userId: clerkId, // Use clerkId, not user.id
      },
    })
    console.log("Forum topics count:", forumTopicsCount)

    // Get comment count from forum comments - using clerkId
    const commentCount = await prisma.forumComment.count({
      where: {
        userId: clerkId, // Use clerkId, not user.id
      },
    })
    console.log("Comment count:", commentCount)

    // Get recent comments - using clerkId
    const recentComments = await prisma.forumComment.findMany({
      where: {
        userId: clerkId, // Use clerkId, not user.id
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
    console.log("Recent comments count:", recentComments.length)

    // Format recent comments for the frontend
    const formattedRecentComments = recentComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      projectTitle: comment.topic?.title || "Unknown Topic",
      topicId: comment.topic?.id || "",
    }))

    // Calculate average rating for the user's projects
    const projectReviews = await prisma.review.findMany({
      where: {
        project: {
          userId: clerkId,
        },
      },
    })

    const totalScore = projectReviews.reduce((sum, review) => sum + review.score, 0)
    const averageRating = projectReviews.length > 0 ? totalScore / projectReviews.length : null
    const reviewCount = projectReviews.length

    const userData = {
      ...user,
      activity: {
        projectsCreated: projectCount,
        projectsJoined: 0, // This could be implemented later if project joining functionality is added
        commentsPosted: commentCount,
        forumTopicsCreated: forumTopicsCount,
        recentComments: formattedRecentComments,
      },
      averageRating,
      reviewCount,
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error("Error fetching user activity:", error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  }
}

// Add PATCH method to handle user updates
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()

    // First check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    })

    let updatedUser

    if (existingUser) {
      // Update the existing user
      updatedUser = await prisma.user.update({
        where: {
          clerkId: userId,
        },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          university: data.university,
          faculty: data.faculty,
          city: data.city,
          year: data.year,
        },
      })
    } else {
      // Create a new user if they don't exist
      updatedUser = await prisma.user.create({
        data: {
          clerkId: userId,
          firstName: data.firstName,
          lastName: data.lastName,
          university: data.university,
          faculty: data.faculty,
          city: data.city,
          year: data.year,
          email: data.email || "", // Add email if available
        },
      })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  }
}

