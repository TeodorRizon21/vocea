import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

const f = createUploadthing()

const handleAuth = async (req: NextRequest) => {
  const { userId } = getAuth(req)
  if (!userId) throw new Error("Unauthorized")
  return { userId }
}

export const ourFileRouter = {
  projectImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 4 },
  })
    .middleware(async ({ req }) => {
      const user = await handleAuth(req)
      return user
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId)
      console.log("File URL:", file.url)
      return { url: file.url }
    }),

  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await handleAuth(req)
      return user
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId)
      console.log("File URL:", file.url)
      return { url: file.url }
    }),

  avatar: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await handleAuth(req)
      return user
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar upload complete for userId:", metadata.userId)
      console.log("File URL:", file.url)
      return { url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // ... existing code ...
  } catch (error) {
    console.error("Error in POST handler:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

