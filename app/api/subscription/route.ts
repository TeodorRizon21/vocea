import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { sendPlanUpdateEmail } from "@/lib/email"

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

    if (!subscription || !["Bronze", "Basic", "Premium", "Gold"].includes(subscription)) {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 })
    }

    // For paid plans, check if there's a pending payment
    if (subscription !== "Basic") {
      const pendingOrder = await prisma.order.findFirst({
        where: {
          userId: user.id,
          status: "PENDING",
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
        userId: user.id, // Fixed: use user.id (MongoDB ObjectId) instead of clerkId
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
        },
      })
    } else {
      // Create new subscription with all required fields
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days from now
      
      await prisma.subscription.create({
        data: {
          userId: user.id, // Use user.id (MongoDB ObjectId) instead of clerkId
          planId: "672950f0b95b7a38088d7bc9", // Default plan ID for Basic - you might want to get this from database
          plan: subscription,
          status: "active",
          startDate,
          endDate,
          amount: 0, // Basic plan is free
          currency: "RON",
        },
      })
    }

    // Send plan update email for Basic plan (paid plans are handled in activation)
    if (subscription === "Basic" && user.email) {
      try {
        await sendPlanUpdateEmail({
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User',
          email: user.email,
          planName: subscription,
          amount: 0,
          currency: 'RON'
        });
      } catch (emailError) {
        console.error('Error sending plan update email:', emailError);
        // Continue execution even if email fails
      }
    }

    return NextResponse.json({ success: true, plan: subscription })
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    
    if (!clerkId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's MongoDB ID first
    const user = await prisma.user.findFirst({
      where: {
        clerkId: clerkId
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get the current subscription - use user.id (MongoDB ObjectId)
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id, // Fixed: use user.id instead of clerkId
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
        userId: user.id,
        status: 'COMPLETED' // Only consider COMPLETED orders
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If we have a completed order that's not reflected in subscription
    if (latestOrder && (!currentSubscription || currentSubscription.plan !== latestOrder.plan.name)) {
      console.log('Found newer completed order with plan:', latestOrder.plan.name);

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // Update or create subscription - use user.id (MongoDB ObjectId)
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id
        }
      });

      if (existingSubscription) {
        await prisma.subscription.update({
          where: {
            id: existingSubscription.id
          },
          data: {
            plan: latestOrder.plan.name,
            status: 'active',
            startDate,
            endDate,
            amount: latestOrder.amount,
            currency: latestOrder.currency
          }
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            planId: latestOrder.planId,
            plan: latestOrder.plan.name,
            status: 'active',
            startDate,
            endDate,
            amount: latestOrder.amount,
            currency: latestOrder.currency
          }
        });
      }

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
        plan: user.planType || 'Basic', // Use user's planType if available, otherwise default to Basic
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
      
      // Update user to Basic plan only if they don't have a Bronze plan
      if (user.planType !== 'Bronze') {
        await prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            planType: 'Basic'
          }
        });
      }
      
      // Return current plan (either Basic or Bronze)
      return NextResponse.json({
        plan: user.planType || 'Basic',
        status: 'active',
        endDate: null
      });
    }

    // Return current subscription
    const responseData = {
      plan: currentSubscription.plan,
      status: currentSubscription.status,
      endDate: currentSubscription.endDate
    };
    
    console.log('[SUBSCRIPTION_API] Returning subscription data:', responseData);
    console.log('[SUBSCRIPTION_API] Current subscription from DB:', currentSubscription);
    console.log('[SUBSCRIPTION_API] User planType from DB:', user.planType);
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[SUBSCRIPTION_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 