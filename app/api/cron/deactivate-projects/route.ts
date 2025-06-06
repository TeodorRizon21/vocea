import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    // Check for authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find and deactivate all active projects older than 30 days
    const deactivatedProjects = await prisma.project.updateMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      success: true,
      deactivatedCount: deactivatedProjects.count
    });
  } catch (error) {
    console.error("Error deactivating old projects:", error);
    return NextResponse.json(
      { error: "Failed to deactivate old projects" },
      { status: 500 }
    );
  }
} 