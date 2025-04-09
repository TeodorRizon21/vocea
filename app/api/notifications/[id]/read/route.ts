import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Find the notification
    const notification = await prisma.notification.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!notification) {
      return new NextResponse("Notification not found", { status: 404 })
    }

    // Check if the notification belongs to the user
    if (notification.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Mark as read
    await prisma.notification.update({
      where: {
        id: params.id,
      },
      data: {
        read: true,
      },
    })

    return new NextResponse("Notification marked as read", { status: 200 })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
