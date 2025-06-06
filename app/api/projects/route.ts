import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"
import { PROJECT_LIMITS, type SubscriptionType } from "@/lib/constants"

export async function GET(req: NextRequest) {
  try {
    // Pentru GET, facem operațiunea fără a verifica autentificarea,
    // pentru a permite vizualizarea proiectelor de către toți utilizatorii
    const type = req.nextUrl.searchParams.get("type") || req.url && new URL(req.url).searchParams.get('type')
    
    console.log("Fetching projects with type:", type);
    
    // Allow public access to browse page without authentication
    const projects = await prisma.project.findMany({
      where: type
        ? {
            type: type,
            isActive: true,
          }
        : {
            isActive: true,
          },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            university: true,
            faculty: true,
            avatar: true,
          },
        },
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    
    console.log(`Found ${projects.length} projects`);
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    console.log("Creating project with data:", data)

    // Get user's subscription
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { planType: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check project limit
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const projectCount = await prisma.project.count({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    const subscriptionType = (user.planType || "Basic") as SubscriptionType
    const limit = PROJECT_LIMITS[subscriptionType]

    if (projectCount >= limit) {
      return NextResponse.json(
        { 
          error: "Monthly project limit reached for your subscription",
          projectCount,
          limit
        }, 
        { status: 403 }
      )
    }

    // Create the project if within limits
    const project = await prisma.project.create({
      data: {
        ...data,
        userId,
        isActive: true,
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}
