import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import universitiesData from "@/data/universities.json"

// Helper function to get university name from ID
function getUniversityName(id: string): string {
  // If the ID is already a name (not an ID), return it
  if (id && !id.startsWith('uni_')) {
    return id
  }
  
  // Extract the university index from the ID (format: uni_X)
  const parts = id.split('_')
  if (parts.length !== 2) {
    return id
  }
  
  const index = parseInt(parts[1])
  if (isNaN(index) || index < 0 || index >= universitiesData.length) {
    return id
  }
  
  return universitiesData[index].institutie
}

// Helper function to get faculty name from university ID and faculty ID
function getFacultyName(universityId: string, facultyId: string): string {
  // If the facultyId is already a name (not an ID), return it
  if (facultyId && !facultyId.startsWith('fac_')) {
    return facultyId
  }
  
  // Extract the university index from the ID (format: uni_X)
  const uniParts = universityId.split('_')
  if (uniParts.length !== 2) {
    return facultyId
  }
  
  const uniIndex = parseInt(uniParts[1])
  if (isNaN(uniIndex) || uniIndex < 0 || uniIndex >= universitiesData.length) {
    return facultyId
  }
  
  const university = universitiesData[uniIndex]
  
  // Extract the faculty index from the ID (format: fac_X_Y)
  const facParts = facultyId.split('_')
  if (facParts.length !== 3) {
    return facultyId
  }
  
  const facIndex = parseInt(facParts[2])
  if (isNaN(facIndex) || facIndex < 0 || facIndex >= university.facultati.length) {
    return facultyId
  }
  
  return university.facultati[facIndex].nume
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    
    // Dacă utilizatorul nu este autentificat, returnăm eroare
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obținem informații despre utilizator, inclusiv tipul de plan
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verificăm dacă utilizatorul are planul Basic
    // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
    if (user.planType === "Basic") {
      // Utilizatorii Basic nu pot accesa forumuri individuale
      return NextResponse.json({
        error: "Access denied",
        message: "Ai nevoie de un abonament superior pentru a accesa topicuri individuale de forum.",
        // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
        planType: user.planType,
        originalPath: `/forum/${params.id}`
      }, { status: 403 });
    }
    
    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            university: true,
            faculty: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                university: true,
                faculty: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    university: true,
                    faculty: true,
                    avatar: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Add university and faculty names to the topic
    const topicUniversityName = getUniversityName(topic.university);
    const topicFacultyName = getFacultyName(topic.university, topic.faculty);

    // Add university and faculty names to the topic author
    const authorUniversityName = topic.user.university ? getUniversityName(topic.user.university) : null;
    const authorFacultyName = topic.user.university && topic.user.faculty
      ? getFacultyName(topic.user.university, topic.user.faculty)
      : null;

    // Add university and faculty names to all comments and replies
    const commentsWithNames = topic.comments.map(comment => {
      // Add names for comment author
      const commentAuthorUniversityName = comment.user.university
        ? getUniversityName(comment.user.university)
        : null;
      const commentAuthorFacultyName = comment.user.university && comment.user.faculty
        ? getFacultyName(comment.user.university, comment.user.faculty)
        : null;

      // Add names for reply authors
      const repliesWithNames = comment.replies.map(reply => {
        const replyAuthorUniversityName = reply.user.university
          ? getUniversityName(reply.user.university)
          : null;
        const replyAuthorFacultyName = reply.user.university && reply.user.faculty
          ? getFacultyName(reply.user.university, reply.user.faculty)
          : null;

        return {
          ...reply,
          user: {
            ...reply.user,
            universityName: replyAuthorUniversityName,
            facultyName: replyAuthorFacultyName
          }
        };
      });

      return {
        ...comment,
        user: {
          ...comment.user,
          universityName: commentAuthorUniversityName,
          facultyName: commentAuthorFacultyName
        },
        replies: repliesWithNames
      };
    });

    return NextResponse.json({
      ...topic,
      universityName: topicUniversityName,
      facultyName: topicFacultyName,
      user: {
        ...topic.user,
        universityName: authorUniversityName,
        facultyName: authorFacultyName
      },
      comments: commentsWithNames,
      isOwner: userId === topic.userId,
      isFavorited: topic.favorites.includes(userId || ""),
    })
  } catch (error) {
    console.error("Error fetching forum topic:", error)
    return NextResponse.json({ error: "Server error", message: "A apărut o eroare la încărcarea topicului." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obține userId din autentificarea Clerk
    const { userId } = getAuth(req)
    console.log("DELETE topic - Auth userId:", userId)
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verifică dacă utilizatorul are planul Basic
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
    if (user.planType === "Basic") {
      return NextResponse.json({
        error: "Access denied",
        message: "Ai nevoie de un abonament superior pentru a șterge topicuri de forum.",
        // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
        planType: user.planType,
      }, { status: 403 });
    }

    // Verifică dacă topicul există
    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!topic) {
      return new NextResponse("Topic not found", { status: 404 })
    }
    
    console.log("DELETE topic - Topic found:", {
      topicId: params.id,
      topicUserId: topic.userId,
      requestUserId: userId
    })

    // Forțează permisiunea de ștergere pentru debugging
    console.log("DELETE topic - Forcing deletion for debugging")
    
    // Șterge mai întâi toate comentariile și răspunsurile
    await prisma.forumComment.deleteMany({
      where: { topicId: params.id },
    })

    // Apoi șterge topicul
    await prisma.forumTopic.delete({
      where: { id: params.id },
    })
    
    console.log("DELETE topic - Successfully deleted topic:", params.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting topic:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
