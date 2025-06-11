import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { decodeResponse, decodeV2Response } from '@/order';
import { sendPlanUpdateEmail } from '@/lib/email';

// Add SSL bypass for development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('SSL verification disabled for development environment in webhook handler');
}

export async function POST(req: Request) {
  try {
    console.log('[NETOPIA_IPN] Processing IPN request');
    
    // Get raw body
    const rawBody = await req.text();
    console.log('[NETOPIA_IPN] Raw body:', rawBody);

    let paymentData;
    let isV2 = false;

    try {
      // Try parsing as JSON (v2)
      paymentData = JSON.parse(rawBody);
      isV2 = true;
      console.log('[NETOPIA_IPN] Detected v2 IPN format');
    } catch (e) {
      // If not JSON, assume v1 XML format
      console.log('[NETOPIA_IPN] Not JSON, trying v1 XML format');
      paymentData = await decodeResponse(process.env.NETOPIA_PRIVATE_KEY!, rawBody);
    }

    console.log('[NETOPIA_IPN] Decoded payment data:', paymentData);

    // Process payment data based on version
    const processedData = isV2 ? decodeV2Response(paymentData) : paymentData;
    
    console.log('[NETOPIA_IPN] Processed payment data:', processedData);

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderId: processedData.orderID },
      include: {
        user: true,
        plan: true
      }
    });

    if (!order) {
      console.error('[NETOPIA_IPN] Order not found:', processedData.orderID);
      return new NextResponse(JSON.stringify({ errorCode: 3, message: 'Order not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Map Netopia status to our status
    let newStatus: OrderStatus = 'PENDING';
    
    if (processedData.status === 'CONFIRMED' || processedData.status === 'PAID') {
      newStatus = 'COMPLETED';
    } else if (processedData.status === 'CANCELED' || processedData.status === 'DECLINED') {
      newStatus = 'CANCELLED';
    } else if (processedData.status === 'ERROR') {
      newStatus = 'FAILED';
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        netopiaId: processedData.ntpID || null,
        errorMessage: processedData.errorMessage || null,
        lastError: processedData.errorCode ? `${processedData.errorCode}: ${processedData.errorMessage}` : null,
        updatedAt: new Date()
      }
    });

    // If payment is successful, create or update subscription
    if (newStatus === 'COMPLETED') {
      const plan = await prisma.plan.findFirst({
        where: { name: order.subscriptionType }
      });

      if (!plan) {
        console.error('[NETOPIA_IPN] Plan not found:', order.subscriptionType);
        return new NextResponse(JSON.stringify({ errorCode: 4, message: 'Plan not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days subscription

      await prisma.subscription.create({
        data: {
          userId: order.userId,
          planId: plan.id,
          orderId: order.id,
          startDate,
          endDate,
          status: 'active',
          plan: order.subscriptionType,
          amount: order.amount,
          currency: order.currency
        }
      });

      console.log('[NETOPIA_IPN] Subscription created successfully');

      // Send appropriate email based on payment status
      if (order.user.email) {
        const userName = order.user.firstName 
          ? `${order.user.firstName} ${order.user.lastName || ''}`.trim() 
          : 'User';

        await sendPlanUpdateEmail({
          name: userName,
          email: order.user.email,
          planName: order.plan.name,
          amount: order.amount,
          currency: order.currency
        });
      }
    }

    return new NextResponse(JSON.stringify({ errorCode: 0 }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[NETOPIA_IPN] Error processing IPN:', error);
    return new NextResponse(JSON.stringify({ 
      errorCode: 5, 
      message: error instanceof Error ? error.message : 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 