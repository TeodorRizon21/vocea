import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!params.commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    const comment = await prisma.forumComment.findUnique({
      where: { id: params.commentId },
      include: { topic: true },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Allow deletion if user is comment author or topic owner
    if (comment.userId !== userId && comment.topic.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete all replies first
    await prisma.forumComment.deleteMany({
      where: { parentId: params.commentId },
    })

    // Then delete the comment
    await prisma.forumComment.delete({
      where: { id: params.commentId },
    })

    return NextResponse.json(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

