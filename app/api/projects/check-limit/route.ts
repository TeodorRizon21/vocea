import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PROJECT_LIMITS, type SubscriptionType } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's subscription from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { planType: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the start of the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Count projects created this month
    const projectCount = await prisma.project.count({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth
        },
        isActive: true // Only count active projects
      }
    });

    // Get the limit based on subscription
    const subscriptionType = (user.planType || "Basic") as SubscriptionType;
    const limit = PROJECT_LIMITS[subscriptionType];
    
    // For Gold plan (or any plan with Infinity limit), explicitly set remaining to Infinity
    const remaining = limit === Infinity ? Infinity : limit - projectCount;
    
    console.log("Sending quota data:", {
      projectCount,
      limit,
      canCreateProject: limit === Infinity ? true : projectCount < limit,
      remaining
    });

    return NextResponse.json({
      projectCount,
      limit,
      canCreateProject: limit === Infinity ? true : projectCount < limit,
      remaining,
      message: {
        ro: `Poți crea încă ${remaining === Infinity ? "∞" : remaining} proiecte active luna aceasta`,
        en: `You can create ${remaining === Infinity ? "∞" : remaining} more active projects this month`
      }
    });
  } catch (error) {
    console.error("Error checking project limit:", error);
    return NextResponse.json(
      { error: "Failed to check project limit" },
      { status: 500 }
    );
  }
} 