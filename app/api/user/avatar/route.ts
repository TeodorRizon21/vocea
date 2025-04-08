import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { avatar } = await req.json()

    if (!avatar) {
      return new NextResponse("Avatar URL is required", { status: 400 })
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
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

