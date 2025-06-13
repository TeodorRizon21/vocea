import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

// v2.x IPN Response structure conform documentației NETOPIA
interface NetopiaV2IpnData {
  ntpID: string;
  orderID: string;
  amount: number;
  currency: string;
  status: number; // Status codes conform documentației: 3=Paid, 5=Confirmed, 12=Invalid account, 15=3DS required
  paymentMethod: string;
  maskedCard?: string;
  rrn?: string;
  authCode?: string;
  errorCode?: number; // Error codes conform documentației: 0=Success, 19=Expired, 20=Insufficient funds, etc.
  errorMessage?: string;
  // Recurring payment fields
  token?: string; // Token for recurring payments
  tokenExpiryDate?: string; // Token expiration date
}

export async function POST(req: Request) {
  try {
    console.log('[NETOPIA_V2_IPN] Processing v2.x IPN notification');
    
    // Log headers pentru debugging
    console.log('[NETOPIA_V2_IPN] Request headers:', {
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent'),
      authorization: req.headers.get('authorization') ? 'Present' : 'Missing',
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer')
    });

    // Parse JSON payload (v2.x sends JSON instead of encrypted XML)
    let ipnData: NetopiaV2IpnData;
    try {
      ipnData = await req.json();
      console.log('[NETOPIA_V2_IPN] Full parsed JSON:', JSON.stringify(ipnData, null, 2));
    } catch (parseError) {
      console.error('[NETOPIA_V2_IPN] Failed to parse JSON:', parseError);
      // Încearcă să citească ca text pentru debugging
      try {
        const text = await req.text();
        console.log('[NETOPIA_V2_IPN] Raw body text:', text);
      } catch (textError) {
        console.error('[NETOPIA_V2_IPN] Failed to read body as text:', textError);
      }
      return new NextResponse('Invalid JSON payload', { status: 400 });
    }
    
    console.log('[NETOPIA_V2_IPN] Received data:', {
      orderID: ipnData.orderID,
      status: ipnData.status,
      amount: ipnData.amount,
      currency: ipnData.currency,
      ntpID: ipnData.ntpID,
      errorCode: ipnData.errorCode,
      errorMessage: ipnData.errorMessage,
      paymentMethod: ipnData.paymentMethod,
      maskedCard: ipnData.maskedCard,
      rrn: ipnData.rrn,
      authCode: ipnData.authCode,
      token: ipnData.token,
      tokenExpiryDate: ipnData.tokenExpiryDate
    });

    // Validate required fields
    if (!ipnData.orderID || ipnData.status === undefined) {
      console.error('[NETOPIA_V2_IPN] Missing required fields in IPN data');
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Map v2.x status codes to our order status conform documentației NETOPIA
    let orderStatus: OrderStatus;
    let errorDescription = '';

    // Verifică întâi codurile de eroare conform documentației
    if (ipnData.errorCode !== undefined && ipnData.errorCode !== 0) {
      orderStatus = 'FAILED';
      switch (ipnData.errorCode) {
        case 19:
          errorDescription = 'Expired Card';
          break;
        case 20:
          errorDescription = 'Insufficient funds';
          break;
        case 21:
        case 22:
          errorDescription = 'CVV error';
          break;
        case 34:
          errorDescription = 'Transaction not allowed for this card';
          break;
        case 56:
          errorDescription = 'Order closed (duplicate or already completed)';
          break;
        case 99:
          errorDescription = 'Another order with a different amount';
          break;
        case 100:
          errorDescription = 'Requires 3-D Secure (or missing/invalid params)';
          break;
        default:
          errorDescription = ipnData.errorMessage || `Unknown error code: ${ipnData.errorCode}`;
      }
    } else {
      // Dacă nu e eroare, verifică status codes conform documentației
      switch (ipnData.status) {
        case 3: // Paid
        case 5: // Confirmed
          orderStatus = 'COMPLETED';
          break;
        case 12: // Invalid account
          orderStatus = 'FAILED';
          errorDescription = 'Invalid account';
          break;
        case 15: // 3-D Secure authentication required
          orderStatus = 'PENDING';
          errorDescription = '3-D Secure authentication required';
          break;
        default:
          orderStatus = 'PENDING';
          errorDescription = `Unknown status code: ${ipnData.status}`;
      }
    }

    console.log('[NETOPIA_V2_IPN] Status mapping:', {
      originalStatus: ipnData.status,
      originalErrorCode: ipnData.errorCode,
      mappedStatus: orderStatus,
      errorDescription
    });

    // Find the order in database
    const order = await prisma.order.findUnique({
      where: { orderId: ipnData.orderID },
      include: { 
        user: true,
        plan: true
      }
    });

    if (!order) {
      console.error('[NETOPIA_V2_IPN] Order not found:', ipnData.orderID);
      return new NextResponse('Order not found', { status: 404 });
    }

    console.log('[NETOPIA_V2_IPN] Found order:', {
      orderId: order.orderId,
      currentStatus: order.status,
      newStatus: orderStatus,
      userId: order.user.clerkId,
      planName: order.plan?.name
    });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { orderId: ipnData.orderID },
      data: { 
        status: orderStatus,
        ...(errorDescription && {
          failureReason: errorDescription
        }),
        // Update payment details
        ...(orderStatus === 'COMPLETED' && {
          paidAt: new Date(),
          paymentMethod: ipnData.paymentMethod,
          transactionId: ipnData.ntpID,
          // Store recurring payment token if received
          ...(ipnData.token && {
            token: ipnData.token,
            tokenExpiry: ipnData.tokenExpiryDate ? new Date(ipnData.tokenExpiryDate) : null
          }),
          // Set next charge date for recurring payments
          ...(order.isRecurring && {
            lastChargeAt: new Date(),
            nextChargeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          })
        })
      }
    });

    // If payment is successful, create or update subscription
    if (orderStatus === 'COMPLETED') {
      console.log('[NETOPIA_V2_IPN] Payment successful, updating subscription');
      
      try {
        // Calculate subscription end date (1 month from now)
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        // Create or update subscription
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            userId: order.user.id // Use MongoDB ObjectId instead of clerkId
          }
        });

        if (existingSubscription) {
          await prisma.subscription.update({
            where: {
              id: existingSubscription.id
            },
            data: {
              plan: order.subscriptionType || 'Basic',
              status: 'active',
              startDate: new Date(),
              endDate
            }
          });
        } else {
          await prisma.subscription.create({
            data: {
              userId: order.user.id, // Use MongoDB ObjectId instead of clerkId
              planId: order.planId,
              plan: order.subscriptionType || 'Basic',
              status: 'active',
              startDate: new Date(),
              endDate,
              amount: order.amount,
              currency: order.currency
            }
          });
        }

        // Update user's plan type
        await prisma.user.update({
          where: { clerkId: order.user.clerkId },
          data: { 
            planType: (order.subscriptionType as 'Basic' | 'Bronze' | 'Premium' | 'Gold') || 'Basic'
          }
        });

        console.log('[NETOPIA_V2_IPN] Subscription updated successfully');
      } catch (subscriptionError) {
        console.error('[NETOPIA_V2_IPN] Error updating subscription:', subscriptionError);
        // Don't fail the IPN if subscription update fails
      }
    }

    console.log('[NETOPIA_V2_IPN] IPN processed successfully');
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('[NETOPIA_V2_IPN_ERROR]', error);
    return new NextResponse('Error processing IPN', { status: 500 });
  }
} 