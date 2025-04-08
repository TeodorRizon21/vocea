import { PrismaClient } from "@prisma/client"
import { createClerkClient } from "@clerk/backend"
import { config } from 'dotenv'

const prisma = new PrismaClient()
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

async function main() {
  // Get all projects
  const projects = await prisma.project.findMany()

  // Update each project
  for (const project of projects) {
    try {
      // Get the Clerk user data
      const user = await clerk.users.getUser(project.userId)

      // Update the project with author info
      await prisma.project.update({
        where: { id: project.id },
        data: {
          authorName: user.firstName || user.username || "Anonymous",
          authorAvatar: user.imageUrl,
        },
      })

      console.log(`Updated project ${project.id}`)
    } catch (error) {
      console.error(`Error updating project ${project.id}:`, error)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

