import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Get body data
    const { orderId } = await req.json();
    
    if (!orderId) {
      return new NextResponse('Order ID is required', { status: 400 });
    }

    // First find the user record to get their MongoDB ID
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: {
        orderId
      },
      include: {
        plan: true
      }
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    // Verify that the order belongs to the authenticated user
    if (order.userId !== user.id) {
      return new NextResponse('Unauthorized: Order does not belong to user', { status: 403 });
    }

    // Update the order status to COMPLETED
    const updatedOrder = await prisma.order.update({
      where: {
        orderId
      },
      data: {
        status: 'COMPLETED'
      }
    });

    // If the order contains a plan, update the user's subscription
    if (order.plan && order.planId) {
      try {
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
            plan: order.plan.name,
            status: 'active',
            startDate,
            endDate,
            projectsPosted: 0
          },
          update: {
            plan: order.plan.name,
            status: 'active',
            startDate,
            endDate,
            ...(order.plan.name === 'Gold' ? { projectsPosted: 0 } : {})
          }
        });

        // Update user's plan type
        await prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            planType: order.plan.name
          }
        });
      } catch (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        // Continue execution even if subscription update fails
      }
    } else {
      console.warn('Order does not have an associated plan, skipping subscription update');
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('[COMPLETE_PAYMENT_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}