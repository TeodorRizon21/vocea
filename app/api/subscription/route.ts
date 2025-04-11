import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    console.log("Auth userId in POST /api/subscription:", userId)
    
    if (!userId) {
      console.error("Unauthorized: No userId found in POST /api/subscription")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subscription } = await req.json()
    console.log("Subscription data received:", subscription)

    if (!subscription || !["Basic", "Premium", "Gold"].includes(subscription)) {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 })
    }

    // Update user's plan type - handling the typing issue
    await prisma.user.update({
      where: {
        clerkId: userId,
      },
      data: {
        // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
        planType: subscription,
      },
    })

    // Create or update subscription record
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
      },
    })

    if (existingSubscription) {
      await prisma.subscription.update({
        where: {
          id: existingSubscription.id,
        },
        data: {
          plan: subscription,
          status: "active",
          // Reset projectsPosted count if downgrading from Gold to Premium
          // @ts-ignore - projectsPosted exists in the schema but TypeScript definitions aren't updated
          ...(existingSubscription.plan === "Gold" && subscription === "Premium" ? { projectsPosted: 0 } : {})
        },
      })
    } else {
      await prisma.subscription.create({
        data: {
          userId: userId,
          plan: subscription,
          status: "active",
        },
      })
    }

    return NextResponse.json({ success: true, plan: subscription })
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    console.log("Auth userId in GET /api/subscription:", userId)
    
    if (!userId) {
      console.error("Unauthorized: No userId found in GET /api/subscription")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Find user in our database
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
      select: {
        planType: true,
      },
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Also get subscription details if they exist
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: "active",
      },
    })
    
    return NextResponse.json({
      // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
      plan: user.planType,
      details: subscription || null,
    })
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 