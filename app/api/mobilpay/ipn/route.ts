import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeIpnResponse, validatePayment } from '@/lib/netopia';
import crypto from 'crypto';
import { sendPlanUpdateEmail, sendPaymentFailedEmail } from '@/lib/email';
import type { Prisma } from '@prisma/client';
import { OrderStatus } from '@prisma/client';

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

// Keep track of processed IPNs to avoid duplicates
const processedIpns = new Set<string>();

export async function POST(req: Request) {
  try {
    // Decode and validate the IPN response
    const ipnResponse = await decodeIpnResponse(req);
    const { orderId, status, errorCode, errorMessage, amount, isRecurring, recurringDetails } = ipnResponse;

    // Generate a unique IPN ID
    const ipnId = `${orderId}_${Date.now()}`;
    
    // Check if we've already processed this IPN
    if (processedIpns.has(ipnId)) {
      console.log('[IPN_DUPLICATE]', { ipnId });
      return new NextResponse('Already processed', { status: 200 });
    }

    // Add to processed set
    processedIpns.add(ipnId);
    
    // Clean up old IPN IDs (keep last 1000)
    if (processedIpns.size > 1000) {
      const idsArray = Array.from(processedIpns);
      idsArray.slice(0, idsArray.length - 1000).forEach(id => processedIpns.delete(id));
    }

    // Log the IPN details
    console.log('[IPN_RECEIVED]', {
      orderId,
      status,
      errorCode,
      amount,
      isRecurring,
      recurringDetails
    });

    // Validate the payment
    const { isValid, paymentStatus } = validatePayment(status, errorCode);
    if (!isValid) {
      console.error('[IPN_INVALID]', { orderId, status, errorCode, errorMessage });
      return new NextResponse('Invalid payment', { status: 400 });
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { user: true, plan: true }
    });

    if (!order) {
      console.error('[IPN_ORDER_NOT_FOUND]', { orderId });
      return new NextResponse('Order not found', { status: 404 });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { orderId },
      data: {
        status: paymentStatus === 'COMPLETED' ? OrderStatus.COMPLETED : OrderStatus.FAILED,
        lastChargeAt: new Date(),
        nextChargeAt: isRecurring ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
      }
    });

    // Handle recurring payment status
    if (isRecurring) {
      if (paymentStatus === 'COMPLETED') {
        // Successful recurring payment
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            planType: order.plan.name
          }
        });

        // Send success notification
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: order.userId,
              type: 'RECURRING_PAYMENT_SUCCESS',
              message: `Your subscription has been renewed successfully. Next payment will be on ${updatedOrder.nextChargeAt?.toLocaleDateString()}.`
            })
          });
        } catch (error) {
          console.error('[NOTIFICATION_ERROR]', error);
        }
      } else {
        // Failed recurring payment
        console.error('[RECURRING_PAYMENT_FAILED]', {
          orderId,
          user: order.user.email,
          plan: order.plan.name,
          amount: order.amount,
          error: errorMessage
        });

        // Calculate next attempt date (3 days from now)
        const nextAttemptDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        // Send payment failed email if user has an email
        if (order.user.email) {
          try {
            await sendPaymentFailedEmail({
              name: order.user.firstName || 'User',
              email: order.user.email,
              planName: order.plan.name,
              amount: order.amount,
              currency: order.currency,
              nextAttemptDate
            });

            console.log('[PAYMENT_FAILED_EMAIL_SENT]', {
              user: order.user.email,
              nextAttemptDate
            });
          } catch (error) {
            console.error('[PAYMENT_FAILED_EMAIL_ERROR]', error);
          }
        } else {
          console.warn('[PAYMENT_FAILED_NO_EMAIL]', {
            userId: order.userId,
            orderId
          });
        }

        // Send notification
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: order.userId,
              type: 'RECURRING_PAYMENT_FAILED',
              message: `Your subscription payment has failed. Please update your payment method to avoid service interruption.`
            })
          });
        } catch (error) {
          console.error('[NOTIFICATION_ERROR]', error);
        }
      }
    }

    // Log successful processing
    console.log('[IPN_PROCESSED]', {
      orderId,
      status: updatedOrder.status,
      nextChargeAt: updatedOrder.nextChargeAt
    });

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('[IPN_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
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