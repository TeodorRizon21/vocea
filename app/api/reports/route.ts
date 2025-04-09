import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { type, contentId, reason } = await req.json()

    if (!type || !contentId || !reason) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Create the report
    const reportData: any = {
      type,
      reason,
      status: "pending",
      reporterId: userId,
    }

    // Add the appropriate content ID based on type
    if (type === "project") {
      reportData.projectId = contentId
    } else if (type === "forum_topic") {
      reportData.topicId = contentId
    } else if (type === "forum_comment") {
      reportData.commentId = contentId
    }

    const report = await prisma.report.create({
      data: reportData,
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error creating report:", error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  }
}

export async function GET(req: Request) {
  try {
    // For testing purposes, allow all users to see reports
    // In production, you should check if the user is an admin

    // Get all reports with related content
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            firstName: true,
            lastName: true,
            university: true,
            faculty: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            type: true,
            university: true,
            faculty: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
            university: true,
            faculty: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            topicId: true,
            topic: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching reports:", error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  }
}
