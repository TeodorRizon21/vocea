import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // For testing purposes, allow all users to update reports
    // In production, you should check if the user is an admin

    const { id } = params
    const { status } = await req.json()

    if (!status || !["pending", "resolved", "dismissed"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 })
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error updating report:", error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // For testing purposes, allow all users to delete reports
    // In production, you should check if the user is an admin

    const { id } = params

    await prisma.report.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting report:", error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  }
}

