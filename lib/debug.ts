import { prisma } from "./prisma"

export async function debugUserContent(userId: string) {
  try {
    console.log("=== DEBUG USER CONTENT ===")
    console.log("User ID:", userId)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, clerkId: true },
    })
    console.log("User:", user)

    // Check projects
    const projects = await prisma.project.findMany({
      where: { userId },
      select: { id: true, title: true },
      take: 5,
    })
    console.log("Projects:", projects)

    // Check forum topics
    const topics = await prisma.forumTopic.findMany({
      where: { userId },
      select: { id: true, title: true },
      take: 5,
    })
    console.log("Forum Topics:", topics)

    // Check comments
    const comments = await prisma.forumComment.findMany({
      where: { userId },
      select: { id: true, content: true, topicId: true },
      take: 5,
    })
    console.log("Comments:", comments)

    console.log("=== END DEBUG ===")

    return {
      user,
      projects,
      topics,
      comments,
    }
  } catch (error) {
    console.error("Debug error:", error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

