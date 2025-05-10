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
    
    // Get the user's MongoDB ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { subscription } = await req.json()
    console.log("Subscription data received:", subscription)

    if (!subscription || !["Basic", "Premium", "Gold"].includes(subscription)) {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 })
    }

    // For paid plans, check if there's a pending payment
    if (subscription !== "Basic") {
      const pendingOrder = await prisma.order.findFirst({
        where: {
          userId: user.id,
          status: "pending",
          subscriptionType: subscription,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!pendingOrder) {
        return NextResponse.json({ error: "No pending payment found" }, { status: 400 });
      }
    }

    // Update user's plan type
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        // @ts-ignore - planType exists in the schema but TypeScript definitions aren't updated
        planType: subscription,
      },
    })

    // Create or update subscription record
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
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
          userId,
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
    const { userId } = getAuth(req);
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's MongoDB ID first
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get the current subscription
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['active', 'cancelled']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check for latest order, even if it's still PENDING
    const latestOrder = await prisma.order.findFirst({
      where: {
        userId: user.id
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If we have a latest payment and it's not already reflected in subscription
    if (latestOrder && (!currentSubscription || currentSubscription.plan !== latestOrder.plan.name)) {
      console.log('Found newer order with plan:', latestOrder.plan.name);
      
      // Automatically update order to COMPLETED if it's still PENDING
      if (latestOrder.status === 'PENDING') {
        console.log('Updating order status from PENDING to COMPLETED');
        await prisma.order.update({
          where: { id: latestOrder.id },
          data: { status: 'COMPLETED' }
        });
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // Update or create subscription
      await prisma.subscription.upsert({
        where: {
          userId
        },
        create: {
          userId,
          plan: latestOrder.plan.name,
          status: 'active',
          startDate,
          endDate,
          projectsPosted: 0
        },
        update: {
          plan: latestOrder.plan.name,
          status: 'active',
          startDate,
          endDate,
          // Reset projectsPosted if upgrading to a higher plan
          ...(latestOrder.plan.name === 'Gold' ? { projectsPosted: 0 } : {})
        }
      });

      // Update user's plan type in User model
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          planType: latestOrder.plan.name
        }
      });

      console.log('Updated user plan to:', latestOrder.plan.name);

      // Return the updated subscription
      return NextResponse.json({
        plan: latestOrder.plan.name,
        status: 'active',
        startDate,
        endDate
      });
    }

    // If no current subscription, default to Basic plan
    if (!currentSubscription) {
      return NextResponse.json({
        plan: 'Basic', // Basic plan never expires
        status: 'active',
        endDate: null
      });
    }

    // Check if subscription has expired
    const now = new Date();
    if (currentSubscription.endDate && currentSubscription.endDate < now) {
      // Update subscription to expired
      await prisma.subscription.update({
        where: {
          id: currentSubscription.id
        },
        data: {
          status: 'expired'
        }
      });
      
      // Update user to Basic plan
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          planType: 'Basic'
        }
      });
      
      // Return Basic plan
      return NextResponse.json({
        plan: 'Basic',
        status: 'active',
        endDate: null
      });
    }

    // Return current subscription
    return NextResponse.json({
      plan: currentSubscription.plan,
      status: currentSubscription.status,
      endDate: currentSubscription.endDate
    });
  } catch (error) {
    console.error('[SUBSCRIPTION_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 