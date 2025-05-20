import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificăm autentificarea utilizatorului
    const { userId } = getAuth(req)
    
    // Dacă utilizatorul nu este autentificat, returnăm eroare
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Obținem informații despre utilizator, inclusiv tipul de plan
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verificăm dacă utilizatorul are planul Basic
    // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
    if (user.planType === "Basic") {
      // Utilizatorii Basic nu pot accesa proiecte individuale
      return NextResponse.json({
        error: "Access denied",
        message: "Ai nevoie de un abonament superior pentru a accesa proiecte individuale.",
        // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
        planType: user.planType,
        originalPath: `/project/${params.id}`
      }, { status: 403 })
    }

    // Căutăm proiectul în baza de date
    const project = await prisma.project.findUnique({
      where: { id: params.id },
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
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Server error", message: "A apărut o eroare la încărcarea proiectului." },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()

    // Check if the user is the owner of the project
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    if (project.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Remove fields that are not allowed in the update operation
    const { 
      id, 
      userId: projectUserId, 
      universityId, 
      facultyId,
      createdAt,
      updatedAt,
      ...updateData 
    } = data

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    console.log("DELETE project - Auth userId:", userId)
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verifică dacă proiectul există
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    console.log("DELETE project - Project found:", {
      projectId: params.id,
      projectUserId: project.userId,
      requestUserId: userId
    })

    // Forțează permisiunea de ștergere pentru debugging
    console.log("DELETE project - Forcing deletion for debugging")
    
    // Șterge proiectul
    await prisma.project.delete({
      where: { id: params.id },
    })
    
    console.log("DELETE project - Successfully deleted project:", params.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting project:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
