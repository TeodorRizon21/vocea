import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeResponse } from '@/order';
import crypto from 'crypto';
import { sendSubscriptionConfirmationEmail, sendPaymentFailedEmail } from '@/lib/email';

// Add SSL bypass for development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('SSL verification disabled for development environment in IPN handler');
}

export async function POST(req: Request) {
  try {
    console.log('--- IPN DEBUG START ---');
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
      console.log('Decoded IPN response:', decodedResponse);
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

    // Properly validate the payment status based on Netopia's response
    // Error code '0' means success, any other code means failure
    const isErrorCode = error && error.$?.code && error.$?.code !== '0';
    const isSuccessStatus = status === 'confirmed' || status === 'paid';
    const paymentStatus = (!isErrorCode && isSuccessStatus) ? 'COMPLETED' : 'FAILED';

    // Log payment validation for debugging
    console.log('Payment validation:', {
      status,
      errorCode: error?.$?.code,
      errorMessage: error?._,
      isErrorCode,
      isSuccessStatus,
      paymentStatus
    });

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

      // Log the order update
      console.log('Updated order status:', {
        orderId,
        status: paymentStatus,
        isErrorCode,
        errorDetails: error
      });

      // Send appropriate email notification based on payment status
      if (orderRecord.user.email) {
        if (paymentStatus === 'FAILED') {
          await sendPaymentFailedEmail(
            orderRecord.user.email,
            orderRecord.plan.name
          );
        }
      }

    } catch (err) {
      console.error('DB error updating order:', err);
      return new NextResponse("DB error updating order", { status: 500 });
    }

    // Create notification for the user based on payment status
    try {
      const notificationMessage = paymentStatus === 'FAILED'
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
      console.error('Error creating notification:', err);
    }

    // Return success response to Netopia
    console.log('--- IPN DEBUG END ---');
    return NextResponse.json({ 
      success: true,
      message: 'IPN processed successfully',
      orderId,
      status: updatedOrder.status
    });

  } catch (error) {
    console.error('[NETOPIA_IPN_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

function verifySignature(body: any, signature: string, privateKey: string): boolean {
  try {
    // Create a string from the body in a consistent format
    const bodyString = JSON.stringify(body);
    
    // Create a hash of the body
    const hash = crypto.createHash('sha256').update(bodyString).digest('hex');
    
    // Verify the signature using the private key
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(hash);
    
    return verifier.verify(privateKey, signature, 'base64');
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
} 