import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()

    if (!data.content) {
      return new NextResponse("Comment content is required", { status: 400 })
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
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
