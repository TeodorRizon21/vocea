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
      return new NextResponse("Original order not found", { status: 404 });
    }

    // Find the new order
    const newOrder = await prisma.order.findUnique({
      where: { orderId }
    });

    if (!newOrder) {
      return new NextResponse("New order not found", { status: 404 });
    }

    // Create payment request with recurring token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentRequest = getRequest(
      orderId,
      newOrder.amount,
      {
        firstName: originalOrder.user.firstName || 'Test',
        lastName: originalOrder.user.lastName || 'User',
        email: originalOrder.user.email || '',
        phone: '1234567890', // Default phone
        address: 'Test Address' // Default address
      },
      {
        returnUrl: `${baseUrl}/api/mobilpay/return`,
        confirmUrl: `${baseUrl}/api/mobilpay/ipn`,
        ipnUrl: `${baseUrl}/api/mobilpay/ipn`
      }
    );

    // Add recurring payment parameters
    paymentRequest.data = paymentRequest.data.replace(
      '<params/>',
      `<params>
        <recurring>
          <initial_order>${originalOrderId}</initial_order>
        </recurring>
      </params>`
    );

    // Send the payment request to Netopia
    const netopiaResponse = await fetch('https://sandboxsecure.mobilpay.ro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        env_key: paymentRequest.env_key,
        data: paymentRequest.data,
        iv: paymentRequest.iv,
        cipher: paymentRequest.cipher
      })
    });

    if (!netopiaResponse.ok) {
      return new NextResponse("Failed to process recurring payment", { status: 500 });
    }

    return new NextResponse("Recurring payment initiated", { status: 200 });

  } catch (error) {
    console.error('[RECURRING_PAYMENT_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 