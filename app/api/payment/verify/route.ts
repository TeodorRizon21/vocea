import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Find the order and include user and plan details
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        user: true,
        plan: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Log the verification request
    console.log('Payment verification request:', {
      orderId,
      currentStatus: order.status,
      timestamp: new Date().toISOString()
    });

    // Check if we need to wait for payment processing
    if (order.status === 'PENDING') {
      // Payment is still being processed
      return NextResponse.json({
        status: 'PENDING',
        message: 'Payment is being processed'
      });
    }

    // Return the order status and redirect URL
    const redirectUrl = order.status === 'COMPLETED'
      ? `/payment/success?orderId=${orderId}`
      : `/payment/failed?orderId=${orderId}`;

    return NextResponse.json({
      status: order.status,
      plan: order.plan.name,
      redirectUrl,
      message: order.status === 'FAILED' ? 'Payment was not successful' : undefined
    });

  } catch (error) {
    console.error('[PAYMENT_VERIFY_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 