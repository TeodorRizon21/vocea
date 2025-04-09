import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const news = await prisma.news.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
    return NextResponse.json(news)
  } catch (error) {
    console.error("Error fetching news:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()

    // Validate required fields
    if (!data.title || !data.description || !data.city) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Validate description length
    if (data.description.length < 300) {
      return new NextResponse("News description must be at least 300 characters", { status: 400 })
    }

    const news = await prisma.news.create({
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
    console.error("Error creating news:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
