import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendPlanCancellationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First get the user details
    const user = await prisma.user.findUnique({
      where: {
        clerkId: session.userId
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
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

    // Send cancellation email
    if (user.email) {
      await sendPlanCancellationEmail({
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User',
        email: user.email,
        planName: subscription.plan || 'Unknown',
        endDate: subscription.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Use existing end date or default to 30 days from now
      });
    }

    return NextResponse.json({ 
      success: true,
      message: `Your subscription has been cancelled. You will continue to have access until ${subscription.endDate?.toLocaleDateString() || 'the end of your billing period'}.`
    });
  } catch (error) {
    console.error('[SUBSCRIPTION_CANCEL_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 