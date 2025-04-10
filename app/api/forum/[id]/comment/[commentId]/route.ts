import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function DELETE(req: NextRequest, { params }: { params: { id: string; commentId: string } }) {
  try {
    // Obține userId din autentificarea Clerk
    const { userId } = getAuth(req)
    console.log("DELETE comment - Auth userId:", userId)
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verifică dacă comentariul există
    const comment = await prisma.forumComment.findUnique({
      where: { id: params.commentId },
      include: { topic: true },
    })

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 })
    }
    
    console.log("DELETE comment - Comment found:", {
      commentId: params.commentId,
      commentUserId: comment.userId,
      topicUserId: comment.topic.userId,
      requestUserId: userId
    })

    // Forțează permisiunea de ștergere pentru debugging
    console.log("DELETE comment - Forcing deletion for debugging")
    
    // Șterge mai întâi toate răspunsurile
    await prisma.forumComment.deleteMany({
      where: { parentId: params.commentId },
    })

    // Apoi șterge comentariul
    await prisma.forumComment.delete({
      where: { id: params.commentId },
    })
    
    console.log("DELETE comment - Successfully deleted comment:", params.commentId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
