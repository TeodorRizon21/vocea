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

    const projects = await prisma.project.findMany({
      where: {
        userId: userId,
      },
      include: {
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const projectCount = await prisma.project.count({
      where: {
        userId: userId,
      },
    })

    return NextResponse.json({ projects, count: projectCount })
  } catch (error) {
    console.error("Error fetching user projects:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

