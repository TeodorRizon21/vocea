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

    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id },
      select: { favorites: true },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    const isFavorited = topic.favorites.includes(userId)
    const updatedTopic = await prisma.forumTopic.update({
      where: { id: params.id },
      data: {
        favorites: isFavorited 
          ? { set: topic.favorites.filter((id) => id !== userId) }
          : { push: userId },
      },
    })

    return NextResponse.json({ isFavorited: !isFavorited })
  } catch (error) {
    console.error("Error toggling favorite:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

