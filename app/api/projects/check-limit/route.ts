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

    // Get user's database ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, planType: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current subscription to determine plan limits
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ['active', 'cancelled'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log("User planType from database:", user.planType);
    console.log("Subscription plan from database:", subscription?.plan || 'No subscription');

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

    // Get the limit based on subscription first, then user.planType, then default to Basic
    // This should match the logic in /api/subscription route
    const subscriptionType = (subscription?.plan || user.planType || "Basic") as SubscriptionType;
    const limit = PROJECT_LIMITS[subscriptionType];
    
    console.log("Subscription calculation:", {
      userPlanType: user.planType,
      subscriptionPlan: subscription?.plan,
      effectiveSubscriptionType: subscriptionType,
      limit,
      PROJECT_LIMITS
    });

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