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
      include: { user: true }
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
      console.log('Payment approved, creating subscription');
      await prisma.subscription.create({
        data: {
          userId: orderRecord.userId,
          plan: orderRecord.subscriptionType,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NETOPIA_WEBHOOK_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 