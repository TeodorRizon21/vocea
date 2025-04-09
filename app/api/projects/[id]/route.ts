import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
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
      return new NextResponse("Project not found", { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
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

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data,
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
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

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

    await prisma.project.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting project:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
