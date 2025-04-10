import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function DELETE(req: NextRequest, { params }: { params: { id: string; commentId: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const comment = await prisma.forumComment.findUnique({
      where: { id: params.commentId },
      include: { topic: true },
    })

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 })
    }

    // Check if the user is comment author or topic owner
    const isCommentAuthor = comment.userId === userId;
    const isTopicOwner = comment.topic.userId === userId;
    
    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    
    const isAdmin = user?.isAdmin === true;
    
    // Allow deletion if user is comment author, topic owner, or admin
    if (!isCommentAuthor && !isTopicOwner && !isAdmin) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Delete all replies first
    await prisma.forumComment.deleteMany({
      where: { parentId: params.commentId },
    })

    // Then delete the comment
    await prisma.forumComment.delete({
      where: { id: params.commentId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
