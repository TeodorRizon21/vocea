import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.userId,
        status: 'active'
      }
    });

    if (!subscription) {
      return new NextResponse("No active subscription found", { status: 404 });
    }

    // Update subscription status to cancelled but keep the end date
    await prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        status: 'cancelled',
        // Keep the existing endDate
      }
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'subscription',
        message: `Your ${subscription.plan} subscription has been cancelled. You will continue to have access until ${subscription.endDate?.toLocaleDateString() || 'the end of your billing period'}.`,
        read: false
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Your subscription has been cancelled. You will continue to have access until ${subscription.endDate?.toLocaleDateString() || 'the end of your billing period'}.`
    });
  } catch (error) {
    console.error('[SUBSCRIPTION_CANCEL_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 