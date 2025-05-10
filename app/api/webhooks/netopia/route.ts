import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeResponse } from '@/mobilpay-sdk/order';

export async function POST(req: Request) {
  try {
    console.log('Received webhook from Netopia');
    
    const body = await req.json();
    console.log('Webhook body:', body);
    
    // Decode the response from Netopia
    const decodedResponse = await decodeResponse(body);
    console.log('Decoded response:', decodedResponse);

    // Extract order information
    const { order } = decodedResponse;
    const { id: orderId, status } = order;
    console.log('Order details:', { orderId, status });

    // Find the order in our database
    const orderRecord = await prisma.order.findUnique({
      where: { orderId },
      include: { 
        user: true,
        plan: true
      }
    });

    if (!orderRecord) {
      console.log('Order not found:', orderId);
      return new NextResponse("Order not found", { status: 404 });
    }

    console.log('Found order:', orderRecord);

    // Update order status
    await prisma.order.update({
      where: { orderId },
      data: { status: status === 'approved' ? 'COMPLETED' : 'FAILED' }
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

      // Update order status to completed
      await prisma.order.update({
        where: { orderId },
        data: { 
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NETOPIA_WEBHOOK_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 