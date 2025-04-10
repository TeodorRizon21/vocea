import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse, type NextRequest } from "next/server"
import { Prisma } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    console.log("Onboarding API route called");
    const { userId } = getAuth(req)
    console.log("Clerk auth userId:", userId);
    
    if (!userId) {
      console.error("Unauthorized: No userId found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json();
    console.log("Request body received:", body);
    
    // Extract all fields from the request body
    const { 
      firstName, 
      lastName, 
      universityId,
      facultyId,
      university,   // This should be the full university name
      faculty,      // This should be the full faculty name
      city, 
      year 
    } = body;

    console.log("Data to be saved:", { 
      firstName, 
      lastName, 
      universityId,
      facultyId, 
      university, 
      faculty,
      city, 
      year 
    });

    // Ensure we're using the university and faculty name strings (not IDs)
    if (!university || !faculty) {
      console.error("Missing university or faculty name");
      return NextResponse.json({ error: "University and faculty names are required" }, { status: 400 });
    }

    // Validate required fields
    if (!firstName || !lastName || !university || !faculty || !city || !year) {
      console.error("Missing required fields");
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Validate name fields are not empty strings after trimming
    if (!firstName.trim() || !lastName.trim()) {
      return NextResponse.json({ error: "First name and last name cannot be empty" }, { status: 400 });
    }

    // Try to update or create the user with the extracted data
    try {
      // First check if user exists
      const existingUser = await prisma.user.findUnique({
        where: {
          clerkId: userId,
        }
      });

      let user;
      if (existingUser) {
        console.log("Updating existing user with university:", university, "and faculty:", faculty);
        user = await prisma.user.update({
          where: {
            clerkId: userId,
          },
          data: {
            firstName,
            lastName,
            university,        // Store the full university name string
            faculty,           // Store the full faculty name string
            city,
            year,
            isOnboarded: true,
          },
        });
      } else {
        console.log("Creating new user with university:", university, "and faculty:", faculty);
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            firstName,
            lastName,
            university,        // Store the full university name string
            faculty,           // Store the full faculty name string
            city,
            year,
            isOnboarded: true,
          },
        });
      }

      console.log("Successfully saved user with university and faculty:", user);
      return NextResponse.json(user);
    } catch (error) {
      console.error("Error saving user data:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in onboarding:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
