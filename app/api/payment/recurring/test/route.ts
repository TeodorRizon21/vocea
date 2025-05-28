import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return new NextResponse("Test endpoint only available in development", { status: 403 });
    }

    const { orderId } = await req.json();

    // Find the original order
    const originalOrder = await prisma.order.findUnique({
      where: { orderId },
      include: {
        user: true,
        plan: true
      }
    });

    if (!originalOrder) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (!originalOrder.isRecurring) {
      return new NextResponse("Not a recurring payment", { status: 400 });
    }

    // Create a new order for the recurring payment
    const newOrderId = `SUB_${Date.now()}`;
    const newOrder = await prisma.order.create({
      data: {
        orderId: newOrderId,
        amount: originalOrder.amount,
        currency: originalOrder.currency,
        status: 'PENDING',
        subscriptionType: originalOrder.subscriptionType,
        isRecurring: true,
        recurringStatus: 'PENDING',
        userId: originalOrder.userId,
        planId: originalOrder.planId
      }
    });

    // Initiate the recurring payment
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/recurring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: newOrderId,
        originalOrderId: orderId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initiate recurring payment');
    }

    const paymentData = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Test recurring payment initiated',
      newOrderId,
      paymentData
    });

  } catch (error) {
    console.error('[TEST_RECURRING_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 