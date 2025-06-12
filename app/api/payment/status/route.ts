import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      // Get specific order status
      const order = await prisma.order.findUnique({
        where: { orderId },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          },
          plan: true
        }
      });

      if (!order) {
        return new NextResponse("Order not found", { status: 404 });
      }

      return NextResponse.json({
        success: true,
        order: {
          orderId: order.orderId,
          status: order.status,
          amount: order.amount,
          currency: order.currency,
          isRecurring: order.isRecurring,
          plan: order.plan.name,
          user: order.user
        }
      });
    }

    // Get all recurring payments for the user
    const recurringPayments = await prisma.order.findMany({
      where: {
        user: {
          clerkId: session.userId
        },
        isRecurring: true
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      recurringPayments: recurringPayments.map(order => ({
        orderId: order.orderId,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        plan: order.plan.name
      }))
    });

  } catch (error) {
    console.error('[PAYMENT_STATUS_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 