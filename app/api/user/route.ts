import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    console.log("User API called");
    const { userId: clerkId } = getAuth(req)
    console.log("Auth userId in GET /api/user:", clerkId);
    
    if (!clerkId) {
      console.error("Unauthorized: No userId found in GET /api/user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    })

    if (!user) {
      console.log("User not found for clerkId:", clerkId);
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
    console.log("PATCH /api/user called");
    const { userId } = getAuth(req)
    console.log("Auth userId in PATCH /api/user:", userId);
    
    if (!userId) {
      console.error("Unauthorized: No userId found in PATCH /api/user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    console.log("Update data received:", data);

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

    console.log("User updated/created successfully:", updatedUser);
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
