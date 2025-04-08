import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!params.id) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    const data = await req.json()

    if (!data.content) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    // Verify the topic exists
    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    const comment = await prisma.forumComment.create({
      data: {
        content: data.content,
        userId: userId,
        topicId: params.id,
        parentId: data.parentId, // Optional, for replies to comments
      },
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
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

