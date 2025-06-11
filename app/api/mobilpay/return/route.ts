import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeIpnResponse, validatePayment } from '@/lib/netopia';

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

    // Check order status in database
    const order = await prisma.order.findUnique({
      where: { orderId }
    });

    if (!order) {
      console.error('Order not found:', orderId);
      return NextResponse.redirect(new URL('/subscriptions?error=order_not_found', req.url));
    }

    // Redirect based on order status
    if (order.status === 'COMPLETED') {
      return NextResponse.redirect(new URL(`/payment/success?orderId=${orderId}`, req.url));
    } else if (order.status === 'FAILED') {
      return NextResponse.redirect(new URL(`/payment/failed?orderId=${orderId}&error=${order.failureReason || 'Payment failed'}`, req.url));
    } else {
      // Payment still pending
      return NextResponse.redirect(new URL('/subscriptions?status=pending', req.url));
    }

  } catch (error) {
    console.error('[NETOPIA_RETURN_ERROR]', error);
    return NextResponse.redirect(new URL('/subscriptions?error=internal_error', req.url));
  }
}

// Handle POST requests similarly
export const POST = GET; 