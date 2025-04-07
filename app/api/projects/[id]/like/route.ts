import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "")

// Check if a project is liked
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const projectLike = await prisma.projectLike.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: params.id,
        },
      },
    })

    return NextResponse.json({ isLiked: !!projectLike })
  } catch (error) {
    console.error("Error checking project like:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Like a project
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Check if user is trying to like their own project
    if (project.userId === userId) {
      return new NextResponse("You cannot like your own project", { status: 400 })
    }

    // Check if already liked
    const existingLike = await prisma.projectLike.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: params.id,
        },
      },
    })

    if (existingLike) {
      return new NextResponse("Project already liked", { status: 400 })
    }

    // Create the like
    await prisma.projectLike.create({
      data: {
        userId,
        projectId: params.id,
      },
    })

    // Create a notification for the project owner
    await prisma.notification.create({
      data: {
        userId: project.userId,
        type: "project_like",
        message: `Someone liked your project: ${project.title}`,
        read: false,
      },
    })

    // Send email notification if we have the project owner's email
    if (project.user?.email) {
      try {
        const ownerName = project.user.firstName || "there"

        await resend.emails.send({
          from: "Vocea Campusului <noreply@voeceacampusului.ro>",
          to: project.user.email,
          subject: "Your project received a like!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #9333ea;">Hello ${ownerName}!</h2>
              <p>Great news! Someone liked your project <strong>${project.title}</strong>.</p>
              <p>This means your project is getting attention from the community.</p>
              <p>Log in to your dashboard to see more details.</p>
              <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 5px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  This is an automated message from Vocea Campusului. Please do not reply to this email.
                </p>
              </div>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Error sending email notification:", emailError)
        // We don't want to fail the like operation if email fails
      }
    }

    return new NextResponse("Project liked successfully", { status: 200 })
  } catch (error) {
    console.error("Error liking project:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Unlike a project
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Delete the like
    await prisma.projectLike.delete({
      where: {
        userId_projectId: {
          userId,
          projectId: params.id,
        },
      },
    })

    return new NextResponse("Project unliked successfully", { status: 200 })
  } catch (error) {
    console.error("Error unliking project:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

