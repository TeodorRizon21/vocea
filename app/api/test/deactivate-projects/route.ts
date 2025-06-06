import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
    }

    const now = new Date();
    console.log('Current time:', now);

    // Find all active projects and their expiration dates for debugging
    const activeProjects = await prisma.project.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        expiresAt: true
      }
    });

    console.log('Active projects:', activeProjects);

    // Find and deactivate all active projects that have expired
    const deactivatedProjects = await prisma.project.updateMany({
      where: {
        expiresAt: {
          lt: now
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    console.log('Deactivated projects count:', deactivatedProjects.count);

    return NextResponse.json({
      success: true,
      deactivatedCount: deactivatedProjects.count,
      activeProjects: activeProjects
    });
  } catch (error) {
    console.error("Error deactivating old projects:", error);
    return NextResponse.json(
      { error: "Failed to deactivate old projects" },
      { status: 500 }
    );
  }
} 