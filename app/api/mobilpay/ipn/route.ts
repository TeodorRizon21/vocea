import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeResponse } from '@/order';
import crypto from 'crypto';
import { sendSubscriptionConfirmationEmail, sendPaymentFailedEmail } from '@/lib/email';
import fs from 'fs';
import path from 'path';

// Setup logging
const LOG_FILE = path.join(process.cwd(), 'ipn-debug.log');

function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(`IPN DEBUG: ${logMessage}`);
}

// Add global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logToFile(`[IPN_UNHANDLED_REJECTION] ${reason}`);
});

export async function POST(req: Request) {
  try {
    logToFile('\n=== IPN REQUEST RECEIVED ===');
    logToFile(`Request URL: ${req.url}`);
    logToFile(`Request method: ${req.method}`);
    
    // Log all headers
    const headers = Object.fromEntries(req.headers.entries());
    logToFile(`Request headers: ${JSON.stringify(headers, null, 2)}`);

    // Log raw body if available
    const clonedReq = req.clone();
    try {
      const rawBody = await clonedReq.text();
      logToFile(`Raw request body: ${rawBody}`);
    } catch (err: any) {
      logToFile(`Could not read raw body: ${err.message || err}`);
    }

    // Parse form data
    const formData = await req.formData();
    logToFile(`Form data keys: ${Array.from(formData.keys()).join(', ')}`);
    
    // Log each form field
    for (const [key, value] of formData.entries()) {
      logToFile(`Form field ${key}: ${typeof value === 'string' ? value : 'Binary data'}`);
    }

    const envKey = formData.get('env_key');
    const data = formData.get('data');
    const iv = formData.get('iv');
    const cipher = formData.get('cipher');

    logToFile('Form data received:');
    logToFile(`  hasEnvKey: ${!!envKey}`);
    logToFile(`  hasData: ${!!data}`);
    logToFile(`  hasIv: ${!!iv}`);
    logToFile(`  hasCipher: ${!!cipher}`);

    if (!envKey || !data || !iv || !cipher) {
      logToFile('Missing required payment data');
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
      logToFile('Decoded IPN response:');
      logToFile(JSON.stringify(decodedResponse, null, 2));
    } catch (err: any) {
      logToFile('Failed to decode Netopia response:');
      logToFile(err.message || err.toString());
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
    
    logToFile('Transaction details:');
    logToFile(`  orderId: ${orderId}`);
    logToFile(`  status: ${status}`);
    logToFile(`  timestamp: ${timestamp}`);
    logToFile(`  amount: ${amount}`);
    logToFile(`  maskedCard: ${maskedCard}`);
    logToFile(`  paymentMethod: ${paymentMethod}`);
    logToFile(`  isRecurring: ${isRecurring}`);
    logToFile(`  recurringDetails: ${JSON.stringify(recurringDetails)}`);
    logToFile(`  error: ${JSON.stringify(error)}`);

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
    } catch (err: any) {
      logToFile('DB error finding order:');
      logToFile(err.message || err.toString());
      return new NextResponse("DB error finding order", { status: 500 });
    }

    if (!orderRecord) {
      logToFile('Order not found:');
      logToFile(orderId);
      return new NextResponse("Order not found", { status: 404 });
    }
    logToFile('Found order:');
    logToFile(JSON.stringify(orderRecord));

    // Properly validate the payment status based on Netopia's response
    // Error code '0' means success, any other code means failure
    const isErrorCode = error && error.$?.code && error.$?.code !== '0';
    const isSuccessStatus = status === 'confirmed' || status === 'paid';
    const paymentStatus = (!isErrorCode && isSuccessStatus) ? 'COMPLETED' : 'FAILED';

    // Log payment validation for debugging
    logToFile('Payment validation:');
    logToFile(`  status: ${status}`);
    logToFile(`  errorCode: ${error?.$?.code}`);
    logToFile(`  errorMessage: ${error?._}`);
    logToFile(`  isErrorCode: ${isErrorCode}`);
    logToFile(`  isSuccessStatus: ${isSuccessStatus}`);
    logToFile(`  paymentStatus: ${paymentStatus}`);

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

      // If payment is successful, update user's plan and create subscription
      if (paymentStatus === 'COMPLETED') {
        // Update user's plan type
        await prisma.user.update({
          where: { id: orderRecord.user.id },
          data: { planType: orderRecord.subscriptionType }
        });

        // Create or update subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

        await prisma.subscription.create({
          data: {
            userId: orderRecord.user.clerkId,
            plan: orderRecord.subscriptionType,
            startDate,
            endDate,
            status: 'active',
            projectsPosted: 0
          }
        });

        // Send confirmation email
        if (orderRecord.user.email) {
          await sendSubscriptionConfirmationEmail(
            orderRecord.user.email,
            {
              name: orderRecord.user.firstName ? `${orderRecord.user.firstName} ${orderRecord.user.lastName || ''}`.trim() : 'User',
              planName: orderRecord.plan.name,
              endDate: endDate,
              isRecurring: false,
              language: 'en'
            }
          );
        }
      } else if (paymentStatus === 'FAILED' && orderRecord.user.email) {
        await sendPaymentFailedEmail(
          orderRecord.user.email,
          orderRecord.plan.name
        );
      }

    } catch (err: any) {
      logToFile('DB error updating order:');
      logToFile(err.message || err.toString());
      return new NextResponse("DB error updating order", { status: 500 });
    }

    // Create notification for the user based on payment status
    try {
      const notificationMessage = paymentStatus === 'FAILED'
        ? `Your payment for ${orderRecord.plan.name} subscription has failed. Please try again.`
        : `Your payment for ${orderRecord.plan.name} subscription was successful! Your plan has been upgraded.`;

      await prisma.notification.create({
        data: {
          userId: orderRecord.user.clerkId,
          type: 'payment',
          message: notificationMessage,
          read: false
        }
      });

    } catch (err: any) {
      logToFile('Error creating notification:');
      logToFile(err.message || err.toString());
    }

    // Return success response to Netopia
    logToFile('--- IPN DEBUG END ---');
    return NextResponse.json({ 
      success: true,
      message: 'IPN processed successfully',
      orderId,
      status: updatedOrder.status
    });

  } catch (error: any) {
    logToFile('[NETOPIA_IPN_ERROR]');
    logToFile(error.message || error.toString());
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
    
    return verifier.verify(privateKey, Buffer.from(signature, 'base64'));
  } catch (error: any) {
    logToFile('Error verifying signature:');
    logToFile(error.message || error.toString());
    return false;
  }
} 