import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const likedProjects = await prisma.projectLike.findMany({
      where: {
        userId,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            university: true,
            faculty: true,
            createdAt: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(
      likedProjects.map((like) => ({
        id: like.project.id,
        title: like.project.title,
        type: like.project.type,
        category: like.project.category,
        university: like.project.university,
        faculty: like.project.faculty,
        createdAt: like.project.createdAt,
        images: like.project.images,
        likedAt: like.createdAt,
      })),
    )
  } catch (error) {
    console.error("Error fetching liked projects:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

