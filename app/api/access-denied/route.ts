import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  const originalPath = req.nextUrl.searchParams.get('path') || '/';
  
  if (!userId) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized"
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      }
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "User not found"
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return NextResponse.json({
      error: "Access denied",
      message: "Ai nevoie de un abonament superior pentru a accesa această funcționalitate.",
      // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
      planType: user.planType,
      originalPath
    }, { status: 403 });
  } catch (error) {
    console.error("Error in access-denied route:", error);
    return NextResponse.json({ 
      error: "Server error", 
      message: "A apărut o eroare la verificarea permisiunilor."
    }, { status: 500 });
  }
} 