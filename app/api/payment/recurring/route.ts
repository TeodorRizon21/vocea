import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequest } from '@/order';

export async function POST(req: Request) {
  try {
    const { orderId, originalOrderId } = await req.json();

    // Find the original order to get the recurring token
    const originalOrder = await prisma.order.findUnique({
      where: { orderId: originalOrderId },
      include: {
        user: true,
        plan: true
      }
    });

    if (!originalOrder) {
      console.error('[RECURRING_PAYMENT_ERROR] Original order not found:', originalOrderId);
      return new NextResponse("Original order not found", { status: 404 });
    }

    // Find the new order
    const newOrder = await prisma.order.findUnique({
      where: { orderId }
    });

    if (!newOrder) {
      console.error('[RECURRING_PAYMENT_ERROR] New order not found:', orderId);
      return new NextResponse("New order not found", { status: 404 });
    }

    // Create payment request with recurring token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Log the recurring payment attempt
    console.log('[RECURRING_PAYMENT_ATTEMPT]', {
      orderId,
      originalOrderId,
      amount: newOrder.amount,
      plan: originalOrder.plan.name,
      user: originalOrder.user.email
    });

    const paymentRequest = getRequest(
      orderId,
      newOrder.amount,
      {
        firstName: originalOrder.user.firstName || 'Test',
        lastName: originalOrder.user.lastName || 'User',
        email: originalOrder.user.email || '',
        phone: '1234567890', // Default phone since not in user model
        address: 'Test Address' // Default address since not in user model
      },
      {
        returnUrl: `${baseUrl}/payment/verify?orderId=${orderId}`,
        confirmUrl: `${baseUrl}/api/mobilpay/ipn`,
        ipnUrl: `${baseUrl}/api/mobilpay/ipn`
      }
    );

    // Update order status
    await prisma.order.update({
      where: { orderId },
      data: {
        status: 'PENDING',
        isRecurring: true,
        recurringStatus: 'PROCESSING',
        lastChargeAt: new Date()
      }
    });

    // Return the payment request data
    return NextResponse.json({
      success: true,
      env_key: paymentRequest.env_key,
      data: paymentRequest.data,
      iv: paymentRequest.iv,
      cipher: paymentRequest.cipher
    });

  } catch (error) {
    console.error('[RECURRING_PAYMENT_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 