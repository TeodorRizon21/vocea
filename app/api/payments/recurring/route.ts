import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Netopia recurring payment API endpoint
const NETOPIA_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://secure.mobilpay.ro' 
  : 'https://secure.sandbox.netopia-payments.com';

interface RecurringPaymentRequest {
  token: string;
  amount: number;
  currency: string;
  orderID: string;
  billing: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
}

export async function POST(req: Request) {
  try {
    const { userId, subscriptionId } = await req.json();
    
    console.log('[RECURRING_PAYMENT] Processing recurring payment for:', { userId, subscriptionId });

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.error('[RECURRING_PAYMENT] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: user.id,
        status: 'active'
      },
      include: {
        planModel: true
      }
    });

    if (!subscription) {
      console.error('[RECURRING_PAYMENT] Subscription not found');
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Check if user has a stored recurring token (will be available after schema update)
    const userToken = (user as any).recurringToken;
    if (!userToken) {
      console.error('[RECURRING_PAYMENT] No recurring token found for user');
      return NextResponse.json({ error: 'No recurring token found' }, { status: 400 });
    }

    // Check if token is expired (will be available after schema update)
    const tokenExpiry = (user as any).tokenExpiry;
    if (tokenExpiry && new Date() > tokenExpiry) {
      console.error('[RECURRING_PAYMENT] Token expired');
      // Downgrade user to Basic plan
      await downgradeUserToBasic(user.id);
      return NextResponse.json({ error: 'Token expired, user downgraded' }, { status: 400 });
    }

    // Generate new order ID for recurring payment
    const orderID = `REC_${Date.now()}`;
    
    // Create new order record
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        orderId: orderID,
        planId: subscription.planId,
        amount: subscription.planModel.price,
        currency: subscription.currency || 'RON',
        subscriptionType: subscription.planModel.name as any,
        status: 'PENDING',
        isRecurring: true
      }
    });

    // Prepare recurring payment request
    const paymentRequest: RecurringPaymentRequest = {
      token: userToken,
      amount: subscription.planModel.price,
      currency: subscription.currency || 'RON',
      orderID: orderID,
      billing: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        address: (user as any).address || '',
        city: user.city || '',
        country: 'Romania',
        postalCode: (user as any).postalCode || ''
      }
    };

    console.log('[RECURRING_PAYMENT] Making payment request:', {
      orderID,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      tokenPrefix: userToken.substring(0, 20) + '...'
    });

    // Make recurring payment request to Netopia
    const response = await fetch(`${NETOPIA_API_URL}/payment/card/recurrent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NETOPIA_API_KEY!
      },
      body: JSON.stringify(paymentRequest)
    });

    const result = await response.json();
    
    console.log('[RECURRING_PAYMENT] Netopia response:', {
      status: response.status,
      hasError: !!result.error,
      paymentStatus: result.payment?.status
    });

    if (!response.ok || result.error) {
      console.error('[RECURRING_PAYMENT] Payment failed:', result);
      
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'FAILED'
        }
      });

      // Downgrade user to Basic plan after failed payment
      await downgradeUserToBasic(user.id);
      
      return NextResponse.json({ 
        error: 'Payment failed', 
        details: result.error?.message 
      }, { status: 400 });
    }

    // Payment successful - update order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED'
      }
    });

    // Update user's token if new one was provided
    if (result.payment?.token) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          recurringToken: result.payment.token,
          tokenExpiry: result.payment.binding?.expireMonth && result.payment.binding?.expireYear
            ? new Date(result.payment.binding.expireYear, result.payment.binding.expireMonth - 1)
            : null
        } as any
      });
    }

    // Extend subscription by 30 days
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + 30);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        endDate: newEndDate,
        updatedAt: new Date()
      }
    });

    console.log('[RECURRING_PAYMENT] Payment successful, subscription extended to:', newEndDate);

    return NextResponse.json({
      success: true,
      orderID,
      newEndDate,
      transactionId: result.payment?.ntpID
    });

  } catch (error) {
    console.error('[RECURRING_PAYMENT_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to downgrade user to Basic plan
async function downgradeUserToBasic(userId: string) {
  try {
    console.log('[DOWNGRADE] Downgrading user to Basic plan:', userId);
    
    // Update user plan type
    await prisma.user.update({
      where: { id: userId },
      data: {
        planType: 'Basic' as any
      }
    });

    // Deactivate current subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId: userId,
        status: 'active'
      },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    console.log('[DOWNGRADE] User successfully downgraded to Basic plan');
  } catch (error) {
    console.error('[DOWNGRADE_ERROR]', error);
  }
} 