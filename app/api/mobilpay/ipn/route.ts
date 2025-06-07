import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeIpnResponse, validatePayment } from '@/lib/netopia';
import { OrderStatus } from '@prisma/client';

// Keep track of processed IPNs to avoid duplicates
const processedIpns = new Set<string>();

export async function POST(req: Request) {
  try {
    console.log('[IPN_START] Processing IPN notification');
    
    // Decode and validate the IPN response
    const ipnResponse = await decodeIpnResponse(req);
    console.log('[IPN_DECODED]', ipnResponse);

    // Validate payment status
    const { isValid, paymentStatus } = validatePayment(
      ipnResponse.status,
      ipnResponse.errorCode
    );

    // Update order status in database
    const updatedOrder = await prisma.order.update({
      where: { orderId: ipnResponse.orderId },
      data: { 
        status: paymentStatus as OrderStatus,
        ...(ipnResponse.errorCode && {
          failureReason: ipnResponse.errorMessage
        }),
        // Update recurring fields if this is a recurring payment
        ...(isValid && ipnResponse.isRecurring && {
          lastChargeAt: new Date(),
          nextChargeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        })
      }
    });

    // If payment is valid and this is a recurring payment, update subscription
    if (isValid && ipnResponse.isRecurring) {
      // Get the order with user info to find the correct subscription
      const orderWithUser = await prisma.order.findUnique({
        where: { orderId: ipnResponse.orderId },
        include: { user: true }
      });

      if (orderWithUser) {
        // Update subscription status (only fields that exist in the Subscription model)
        await prisma.subscription.updateMany({
          where: {
            userId: orderWithUser.user.clerkId,
            status: { in: ['active', 'cancelled'] }
          },
          data: {
            status: 'active'
          }
        });
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[IPN_ERROR]', error);
    return new NextResponse('Error processing IPN', { status: 500 });
  }
} 