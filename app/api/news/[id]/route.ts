import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()

    if (!data.title || !data.description || !data.city) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Validate description length
    if (data.description.length < 300) {
      return new NextResponse("News description must be at least 300 characters", { status: 400 })
    }

    const news = await prisma.news.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        image: data.image || null,
        city: data.city,
        university: data.university || null,
      },
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error("Error updating news:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if this is the last news item
    const count = await prisma.news.count()
    if (count <= 1) {
      return new NextResponse("Cannot delete the last news item", { status: 400 })
    }

    await prisma.news.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting news:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
