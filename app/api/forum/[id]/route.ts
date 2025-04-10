import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            university: true,
            faculty: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                university: true,
                faculty: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    university: true,
                    faculty: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (!topic) {
      return new NextResponse("Topic not found", { status: 404 })
    }

    return NextResponse.json({
      ...topic,
      isOwner: userId === topic.userId,
      isFavorited: topic.favorites.includes(userId || ""),
    })
  } catch (error) {
    console.error("Error fetching forum topic:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get the topic and check if user is authorized to delete it
    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!topic) {
      return new NextResponse("Topic not found", { status: 404 })
    }

    // Check if the user is the topic creator
    const isOwner = topic.userId === userId;
    
    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    
    const isAdmin = user?.isAdmin === true;
    
    // Allow deletion only if user is owner or admin
    if (!isOwner && !isAdmin) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Delete all comments and replies first
    await prisma.forumComment.deleteMany({
      where: { topicId: params.id },
    })

    // Then delete the topic
    await prisma.forumTopic.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting topic:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
