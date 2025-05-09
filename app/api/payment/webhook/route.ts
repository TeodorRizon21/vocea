import { NextResponse } from 'next/server';
import { verifyPaymentResponse } from '@/lib/netopia';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = formData.get('data') as string;
    const signature = formData.get('signature') as string;

    if (!data || !signature) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the signature
    const isValid = verifyPaymentResponse(data, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse the payment data
    const paymentData = JSON.parse(Buffer.from(data, 'base64').toString());
    const { order_id, status } = paymentData;

    // Update the order and subscription status in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the order status
      const order = await tx.order.update({
        where: { orderId: order_id },
        data: {
          status: status === '0' ? 'COMPLETED' : 'FAILED',
        },
        include: { user: true },
      });

      // If payment is successful, update user's subscription
      if (status === '0') {
        // Update user's plan type
        await tx.user.update({
          where: { id: order.userId },
          data: {
            planType: order.subscriptionType,
          },
        });

        // Update subscription status
        await tx.subscription.updateMany({
          where: {
            userId: order.user.clerkId,
            status: 'pending',
          },
          data: {
            status: 'active',
            startDate: new Date(),
          },
        });
      } else {
        // If payment failed, mark subscription as failed
        await tx.subscription.updateMany({
          where: {
            userId: order.user.clerkId,
            status: 'pending',
          },
          data: {
            status: 'failed',
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment notification' },
      { status: 500 }
    );
  }
} 