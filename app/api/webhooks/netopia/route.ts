import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeResponse } from '@/order';
import { sendPlanUpdateEmail } from '@/lib/email';

// Add SSL bypass for development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('SSL verification disabled for development environment in webhook handler');
}

export async function POST(req: Request) {
  try {
    console.log('--- WEBHOOK DEBUG START ---');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Parse form data
    const formData = await req.formData();
    const envKey = formData.get('env_key');
    const data = formData.get('data');
    const iv = formData.get('iv');
    const cipher = formData.get('cipher');

    console.log('Form data received:', {
      hasEnvKey: !!envKey,
      hasData: !!data,
      hasIv: !!iv,
      hasCipher: !!cipher
    });

    if (!envKey || !data || !iv || !cipher) {
      console.error('Missing required payment data');
      return new NextResponse("Missing required payment data", { status: 400 });
    }

    // Decode the response from Netopia
    let decodedResponse;
    try {
      decodedResponse = await decodeResponse({
        env_key: envKey.toString(),
        data: data.toString(),
        iv: iv.toString(),
        cipher: cipher.toString()
      });
      console.log('Decoded webhook response:', decodedResponse);
    } catch (err) {
      console.error('Failed to decode Netopia response:', err);
      return new NextResponse("Failed to decode Netopia response", { status: 400 });
    }

    // Extract transaction information
    const { order } = decodedResponse;
    const { 
      $: { id: orderId, timestamp },
      mobilpay: {
        action: status,
        original_amount: amount,
        pan_masked: maskedCard,
        payment_instrument_id: paymentMethod,
        error
      },
      params
    } = order;

    // Check if this is a recurring payment
    const isRecurring = !!(params && params.recurring);
    const recurringDetails = isRecurring ? params.recurring : null;
    
    console.log('Transaction details:', { 
      orderId, 
      status, 
      timestamp, 
      amount, 
      maskedCard,
      paymentMethod,
      isRecurring,
      recurringDetails,
      error
    });

    // Find the order in our database with plan details
    let orderRecord;
    try {
      orderRecord = await prisma.order.findUnique({
        where: { orderId },
        include: { 
          user: true,
          plan: true
        }
      });
    } catch (err) {
      console.error('DB error finding order:', err);
      return new NextResponse("DB error finding order", { status: 500 });
    }

    if (!orderRecord) {
      console.error('Order not found:', orderId);
      return new NextResponse("Order not found", { status: 404 });
    }
    console.log('Found order:', orderRecord);

    // Check if there's an error in the payment response
    const hasError = error && (error._ || error.$?.code);
    const paymentStatus = hasError ? 'FAILED' : (status === 'paid' ? 'COMPLETED' : 'FAILED');

    // Update order status and transaction details
    let updatedOrder;
    try {
      updatedOrder = await prisma.order.update({
        where: { orderId },
        data: { 
          status: paymentStatus,
          updatedAt: new Date()
        }
      });

      // Send appropriate email based on payment status
      if (orderRecord.user.email) {
        const userName = orderRecord.user.firstName 
          ? `${orderRecord.user.firstName} ${orderRecord.user.lastName || ''}`.trim() 
          : 'User';

        if (paymentStatus === 'COMPLETED') {
          await sendPlanUpdateEmail({
            name: userName,
            email: orderRecord.user.email,
            planName: orderRecord.plan.name,
            amount: orderRecord.amount,
            currency: orderRecord.currency
          });
        }
        // We no longer send emails for failed payments
      }
    } catch (err) {
      console.error('DB error updating order:', err);
      return new NextResponse("DB error updating order", { status: 500 });
    }

    // Create notification for the user based on payment status
    try {
      const notificationMessage = hasError 
        ? `Your payment for ${orderRecord.plan.name} subscription has failed. Please try again.`
        : `Your payment for ${orderRecord.plan.name} subscription was successful. Please go to your dashboard to activate your subscription.`;

      await prisma.notification.create({
        data: {
          userId: orderRecord.user.clerkId,
          type: 'payment',
          message: notificationMessage,
          read: false
        }
      });
    } catch (err) {
      console.error('DB error creating notification:', err);
    }

    // Return success response to Netopia in their requested format
    console.log('--- WEBHOOK DEBUG END ---');
    
    // Set the Content-Type header to application/json as requested by Netopia
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    // Return the exact format requested by Netopia
    return new NextResponse(JSON.stringify({ errorCode: 0 }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('[NETOPIA_WEBHOOK_ERROR]', error);
    
    // Even in case of error, return the same format but with an error code
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    return new NextResponse(JSON.stringify({ errorCode: 1 }), {
      status: 500,
      headers
    });
  }
} 