import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { avatar } = await req.json()

    if (!avatar) {
      return NextResponse.json(
        { error: "Avatar URL is required" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: {
        clerkId: userId,
      },
      data: {
        avatar,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating avatar:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

