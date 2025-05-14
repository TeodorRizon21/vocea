import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user's MongoDB ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId: session.userId
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Find the latest completed order
    const latestOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        // Add additional verification that payment was actually received
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!latestOrder) {
      return new NextResponse("No valid completed order found", { status: 404 });
    }

    // Double check that the order is actually completed and payment was received
    if (latestOrder.status !== 'COMPLETED') {
      return new NextResponse("Order is not completed", { status: 400 });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: {
        userId: session.userId
      },
      create: {
        userId: session.userId,
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
        ...(latestOrder.plan.name === 'Gold' ? { projectsPosted: 0 } : {})
      }
    });

    // Update user's plan type
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        planType: latestOrder.plan.name
      }
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'subscription',
        message: `Your ${latestOrder.plan.name} subscription has been activated. Your subscription is valid until ${endDate.toLocaleDateString()}.`,
        read: false
      }
    });

    return NextResponse.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate
      }
    });
  } catch (error) {
    console.error('[SUBSCRIPTION_ACTIVATE_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 