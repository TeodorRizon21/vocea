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
    
    // First, update any expired projects
    const now = new Date();
    await prisma.project.updateMany({
      where: {
        expiresAt: {
          lt: now
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });
    
    // Then fetch projects
    const projects = await prisma.project.findMany({
      where: type
        ? type === "joburi-servicii"
          ? {
              // Pentru joburi-servicii, include proiecte cu tipul "diverse" dar cu categoriile oferte-munca sau servicii
              type: "diverse",
              category: {
                in: ["oferte-munca", "servicii"]
              },
              isActive: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } }
              ]
            }
          : {
              type: type,
              isActive: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } }
              ]
            }
        : {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } }
            ]
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
    
    console.log(`Found ${projects.length} active projects`);
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
        },
        isActive: true // Only count active projects
      }
    })

    const subscriptionType = (user.planType || "Basic") as SubscriptionType
    const limit = PROJECT_LIMITS[subscriptionType]

    if (projectCount >= limit) {
      return NextResponse.json(
        { 
          error: "Monthly active project limit reached for your subscription",
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
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
