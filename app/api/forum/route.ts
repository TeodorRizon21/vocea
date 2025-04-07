import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import universitiesData from "@/data/universities.json"

// Helper function to get university name from ID
function getUniversityName(id: string): string {
  // If the ID is already a name (not an ID), return it
  if (id && !id.startsWith('uni_')) {
    return id
  }
  
  // Extract the university index from the ID (format: uni_X)
  const parts = id.split('_')
  if (parts.length !== 2) {
    return id
  }
  
  const index = parseInt(parts[1])
  if (isNaN(index) || index < 0 || index >= universitiesData.length) {
    return id
  }
  
  return universitiesData[index].institutie
}

// Helper function to get faculty name from university ID and faculty ID
function getFacultyName(universityId: string, facultyId: string): string {
  // If the facultyId is already a name (not an ID), return it
  if (facultyId && !facultyId.startsWith('fac_')) {
    return facultyId
  }
  
  // Extract the university index from the ID (format: uni_X)
  const uniParts = universityId.split('_')
  if (uniParts.length !== 2) {
    return facultyId
  }
  
  const uniIndex = parseInt(uniParts[1])
  if (isNaN(uniIndex) || uniIndex < 0 || uniIndex >= universitiesData.length) {
    return facultyId
  }
  
  const university = universitiesData[uniIndex]
  
  // Extract the faculty index from the ID (format: fac_X_Y)
  const facParts = facultyId.split('_')
  if (facParts.length !== 3) {
    return facultyId
  }
  
  const facIndex = parseInt(facParts[2])
  if (isNaN(facIndex) || facIndex < 0 || facIndex >= university.facultati.length) {
    return facultyId
  }
  
  return university.facultati[facIndex].nume
}

export async function GET() {
  try {
    const topics = await prisma.forumTopic.findMany({
      include: {
        comments: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            university: true,
            faculty: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform the topics to include university and faculty names
    const transformedTopics = topics.map(topic => ({
      ...topic,
      universityName: getUniversityName(topic.university),
      facultyName: getFacultyName(topic.university, topic.faculty),
    }))

    return NextResponse.json(transformedTopics)
  } catch (error) {
    console.error("Error fetching forum topics:", error)
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
    if (!data.title || !data.content || !data.university || !data.faculty) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Validate content length
    if (data.content.length < 200) {
      return new NextResponse("Content must be at least 200 characters long", { status: 400 })
    }

    const topic = await prisma.forumTopic.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category || "General",
        university: data.university,
        faculty: data.faculty,
        userId: userId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            university: true,
            faculty: true,
          },
        },
      },
    })

    return NextResponse.json(topic)
  } catch (error) {
    console.error("Error creating forum topic:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

