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
    if (!data.title || !data.title.trim()) {
      return new NextResponse("Titlul este obligatoriu", { status: 400 })
    }

    if (!data.description || !data.description.trim()) {
      return new NextResponse("Descrierea este obligatorie", { status: 400 })
    }

    // City is not required - can be empty or "oricare"
    // if (!data.city || data.city === "oricare") {
    //   return new NextResponse("Orașul este obligatoriu", { status: 400 })
    // }

    // Validate description length
    if (data.description.length < 300) {
      return new NextResponse("Descrierea trebuie să aibă cel puțin 300 de caractere", { status: 400 })
    }

    const news = await prisma.news.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        image: data.image || null,
        city: data.city === "oricare" ? "" : data.city,
        university: data.university === "oricare" ? null : data.university,
      },
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error("Error creating news:", error)
    return new NextResponse("Eroare internă a serverului", { status: 500 })
  }
}
