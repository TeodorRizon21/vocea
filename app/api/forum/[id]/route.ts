import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import universitiesData from "@/data/universities.json"

// Helper function to get university name from ID
function getUniversityName(id: string): string {
  // If the ID is already a name (not an ID), return it
  if (id && !id.startsWith('uni_')) {
    return id
  }
  
  // Extract the university index from the ID (format: uni_X)
  const parts = id.split('_')
  if (parts.length !== 2) {
    return id
  }
  
  const index = parseInt(parts[1])
  if (isNaN(index) || index < 0 || index >= universitiesData.length) {
    return id
  }
  
  return universitiesData[index].institutie
}

// Helper function to get faculty name from university ID and faculty ID
function getFacultyName(universityId: string, facultyId: string): string {
  // If the facultyId is already a name (not an ID), return it
  if (facultyId && !facultyId.startsWith('fac_')) {
    return facultyId
  }
  
  // Extract the university index from the ID (format: uni_X)
  const uniParts = universityId.split('_')
  if (uniParts.length !== 2) {
    return facultyId
  }
  
  const uniIndex = parseInt(uniParts[1])
  if (isNaN(uniIndex) || uniIndex < 0 || uniIndex >= universitiesData.length) {
    return facultyId
  }
  
  const university = universitiesData[uniIndex]
  
  // Extract the faculty index from the ID (format: fac_X_Y)
  const facParts = facultyId.split('_')
  if (facParts.length !== 3) {
    return facultyId
  }
  
  const facIndex = parseInt(facParts[2])
  if (isNaN(facIndex) || facIndex < 0 || facIndex >= university.facultati.length) {
    return facultyId
  }
  
  return university.facultati[facIndex].nume
}

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
            avatar: true,
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
                avatar: true,
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
                    avatar: true,
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

    // Transform the topic to include university and faculty names
    const transformedTopic = {
      ...topic,
      universityName: getUniversityName(topic.university),
      facultyName: getFacultyName(topic.university, topic.faculty),
      isOwner: userId === topic.userId,
      isFavorited: topic.favorites.includes(userId || ""),
    }

    // Transform comments to include university and faculty names
    transformedTopic.comments = topic.comments.map(comment => ({
      ...comment,
      user: {
        ...comment.user,
        universityName: comment.user.university ? getUniversityName(comment.user.university) : null,
        facultyName: comment.user.university && comment.user.faculty ? 
          getFacultyName(comment.user.university, comment.user.faculty) : null,
      },
      replies: comment.replies.map(reply => ({
        ...reply,
        user: {
          ...reply.user,
          universityName: reply.user.university ? getUniversityName(reply.user.university) : null,
          facultyName: reply.user.university && reply.user.faculty ? 
            getFacultyName(reply.user.university, reply.user.faculty) : null,
        },
      })),
    }))

    return NextResponse.json(transformedTopic)
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

    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!topic) {
      return new NextResponse("Topic not found", { status: 404 })
    }

    if (topic.userId !== userId) {
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

