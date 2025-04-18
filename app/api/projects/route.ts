import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"

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
          }
        : undefined,
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
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()
    console.log("Creating project with data:", data)

    // First, get the user from the database to ensure we have their information
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Check user's plan type for limitations
    // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
    if (user.planType === "Basic") {
      return NextResponse.json({
        error: "Access denied",
        message: "Ai nevoie de un abonament superior pentru a crea proiecte.",
        // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
        planType: user.planType,
      }, { status: 403 })
    }

    // For Premium users, check if they've reached their project limit (4)
    // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
    if (user.planType === "Premium") {
      const projectCount = await prisma.project.count({
        where: {
          userId: user.clerkId,
        }
      })

      if (projectCount >= 4) {
        return NextResponse.json({
          error: "Limit reached",
          message: "Ai atins limita de 4 proiecte pentru planul Premium. Fă upgrade la planul Gold pentru proiecte nelimitate.",
          // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
          planType: user.planType,
        }, { status: 403 })
      }
    }

    // Check if user has completed their profile in our database
    if (!user.firstName || !user.lastName) {
      return new NextResponse(JSON.stringify({ error: "Please complete your profile before creating a project" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate phone number
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(data.phoneNumber)) {
      return new NextResponse(JSON.stringify({ error: "Phone number must be exactly 10 digits" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate required fields
    const requiredFields = [
      "type",
      "title",
      "description",
      "subject",
      "category",
      "university",
      "faculty",
      "phoneNumber",
    ]
    const missingFields = requiredFields.filter((field) => !data[field])

    if (missingFields.length > 0) {
      return new NextResponse(
        JSON.stringify({
          error: "Missing required fields",
          fields: missingFields,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Validate study level for academic project types
    if ((data.type === "proiect" || data.type === "cerere") && !data.studyLevel) {
      return new NextResponse(
        JSON.stringify({
          error: "Study level is required for academic projects",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Validate images for non-request projects
    if (data.type !== "cerere" && (!data.images || data.images.length === 0)) {
      return new NextResponse(JSON.stringify({ error: "At least one image is required for this project type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate image count
    if (data.images && data.images.length > 4) {
      return new NextResponse(JSON.stringify({ error: "Maximum of 4 images allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Remove fields that are not in the Prisma schema
    const { universityId, facultyId, city, ...projectData } = data

    const project = await prisma.project.create({
      data: {
        ...projectData,
        userId: user.clerkId,
        authorName: `${user.firstName} ${user.lastName}`,
        authorAvatar: user.avatar || null,
        images: data.images || [],
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
      },
    })

    // If creating project succeeds, update project count in subscription if Premium plan
    // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
    if (user.planType === "Premium") {
      await prisma.subscription.updateMany({
        where: {
          userId: user.clerkId,
          plan: "Premium",
        },
        data: {
          // @ts-ignore - projectsPosted exists in the schema but TypeScript definitions aren't updated
          projectsPosted: {
            increment: 1,
          },
        },
      });
    }

    console.log("Created project with user data:", project)

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return new NextResponse(
      JSON.stringify({
        error: "Failed to create project",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
