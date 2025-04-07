import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id },
      select: { favorites: true },
    })

    if (!topic) {
      return new NextResponse("Topic not found", { status: 404 })
    }

    const isFavorited = topic.favorites.includes(userId)
    const updatedTopic = await prisma.forumTopic.update({
      where: { id: params.id },
      data: {
        favorites: isFavorited ? { set: topic.favorites.filter((id) => id !== userId) } : { push: userId },
      },
    })

    return NextResponse.json({ isFavorited: !isFavorited })
  } catch (error) {
    console.error("Error toggling favorite:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

