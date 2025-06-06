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

    const now = new Date();

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