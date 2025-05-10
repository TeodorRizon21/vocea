import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeResponse } from '@/mobilpay-sdk/order';

export async function GET(req: Request) {
  try {
    console.log('Received GET return from Netopia');
    
    // Get the orderId from the URL
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    
    if (!orderId) {
      console.error('No orderId provided in return URL');
      return NextResponse.redirect(new URL('/subscriptions?error=missing_order', req.url));
    }

    // Find the order in our database
    const orderRecord = await prisma.order.findUnique({
      where: { orderId },
      include: { 
        user: true,
        plan: true
      }
    });

    if (!orderRecord) {
      console.error('Order not found:', orderId);
      return NextResponse.redirect(new URL('/subscriptions?error=order_not_found', req.url));
    }

    // For GET requests, we'll just redirect to the dashboard
    // The IPN handler will handle the actual payment confirmation
    return NextResponse.redirect(new URL('/dashboard?payment=pending', req.url));
  } catch (error) {
    console.error('[NETOPIA_RETURN_GET_ERROR]', error);
    return NextResponse.redirect(new URL('/subscriptions?error=internal_error', req.url));
  }
}

export async function POST(req: Request) {
  try {
    console.log('Received POST return from Netopia');
    
    const formData = await req.formData();
    const envKey = formData.get('env_key');
    const data = formData.get('data');
    const iv = formData.get('iv');
    const cipher = formData.get('cipher');

    if (!envKey || !data || !iv || !cipher) {
      console.error('Missing required payment data');
      return NextResponse.redirect(new URL('/subscriptions?error=missing_data', req.url));
    }

    // Decode the response from Netopia
    const decodedResponse = await decodeResponse({
      env_key: envKey.toString(),
      data: data.toString(),
      iv: iv.toString(),
      cipher: cipher.toString()
    });

    console.log('Decoded return response:', decodedResponse);

    // Extract transaction information
    const { order } = decodedResponse;
    const { 
      id: orderId, 
      status,
      timestamp,
      amount,
      currency,
      pan_masked: maskedCard,
      payment_instrument: paymentMethod
    } = order;

    console.log('Transaction details:', { 
      orderId, 
      status, 
      timestamp, 
      amount, 
      currency,
      maskedCard,
      paymentMethod
    });

    // Find the order in our database
    const orderRecord = await prisma.order.findUnique({
      where: { orderId },
      include: { 
        user: true,
        plan: true
      }
    });

    if (!orderRecord) {
      console.error('Order not found:', orderId);
      return NextResponse.redirect(new URL('/subscriptions?error=order_not_found', req.url));
    }

    // Update order status
    await prisma.order.update({
      where: { orderId },
      data: { 
        status: status === 'approved' ? 'COMPLETED' : 'FAILED',
        updatedAt: new Date()
      }
    });

    // If payment was successful, update the user's subscription
    if (status === 'approved') {
      console.log('Payment approved, updating subscription');
      
      // Calculate subscription end date (30 days from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // Create or update subscription
      await prisma.subscription.upsert({
        where: {
          userId: orderRecord.userId
        },
        create: {
          userId: orderRecord.userId,
          plan: orderRecord.plan.name,
          status: 'active',
          startDate,
          endDate,
          projectsPosted: 0
        },
        update: {
          plan: orderRecord.plan.name,
          status: 'active',
          startDate,
          endDate,
          // Reset projectsPosted if upgrading to a higher plan
          ...(orderRecord.plan.name === 'Gold' ? { projectsPosted: 0 } : {})
        }
      });

      // Update user's plan type
      await prisma.user.update({
        where: {
          id: orderRecord.userId
        },
        data: {
          planType: orderRecord.plan.name
        }
      });

      // Create notification for the user
      await prisma.notification.create({
        data: {
          userId: orderRecord.user.clerkId,
          type: 'subscription',
          message: `Your ${orderRecord.plan.name} subscription has been activated. Your subscription will renew on ${endDate.toLocaleDateString()}.`,
          read: false
        }
      });

      return NextResponse.redirect(new URL('/dashboard?payment=success', req.url));
    } else {
      // Create notification for failed payment
      await prisma.notification.create({
        data: {
          userId: orderRecord.user.clerkId,
          type: 'payment',
          message: `Your payment for ${orderRecord.plan.name} subscription has failed. Please try again.`,
          read: false
        }
      });

      return NextResponse.redirect(new URL('/subscriptions?error=payment_failed', req.url));
    }

  } catch (error) {
    console.error('[NETOPIA_RETURN_POST_ERROR]', error);
    return NextResponse.redirect(new URL('/subscriptions?error=internal_error', req.url));
  }
} 