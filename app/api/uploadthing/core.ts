import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getAuth } from "@clerk/nextjs/server"

const f = createUploadthing()

const handleAuth = async (req: Request) => {
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
