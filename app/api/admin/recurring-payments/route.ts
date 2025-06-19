import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NetopiaV2, formatBillingInfo } from '@/lib/netopia-v2';
import { clerkClient } from '@clerk/nextjs/server';

// Define types for the result details
type PaymentResultDetail = {
  user: string | null;
  status: 'downgraded' | 'renewed' | 'error';
  reason?: string;
  newEndDate?: Date;
  error?: string;
};

type PaymentResults = {
  processed: number;
  successful: number;
  failed: number;
  downgraded: number;
  details: PaymentResultDetail[];
};

export async function POST(req: Request) {
  try {
    // Simple auth check
    const authHeader = req.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'admin-secret';
    

    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[ADMIN_RECURRING] Starting manual recurring payments check...');

    // Find expired subscriptions
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        endDate: {
          lte: new Date()
        }
      },
      include: {
        user: true,
        planModel: true
      }
    });

    console.log(`[ADMIN_RECURRING] Found ${expiredSubscriptions.length} expired subscriptions`);

    const results: PaymentResults = {
      processed: 0,
      successful: 0,
      failed: 0,
      downgraded: 0,
      details: []
    };

    for (const subscription of expiredSubscriptions) {
      try {
        results.processed++;
        
        // Get the last order with token for this user
        const lastOrder = await prisma.order.findFirst({
          where: {
            userId: subscription.userId,
            status: 'COMPLETED',
            token: { not: null }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (!lastOrder?.token) {
          // No token - downgrade user
          console.log(`[ADMIN_RECURRING] ⚠️ No token found for ${subscription.user.email} - downgrading`);
          await downgradeUser(subscription.user.id);
          await sendDowngradeNotification(subscription.user.email || 'unknown@email.com', 'No recurring payment method found');
          results.failed++;
          results.downgraded++;
          results.details.push({
            user: subscription.user.email,
            status: 'downgraded',
            reason: 'No recurring token found'
          });
          continue;
        }

        // Try to renew subscription
        const renewed = await renewSubscription(subscription, lastOrder.token);
        
        if (renewed) {
          results.successful++;
          results.details.push({
            user: subscription.user.email,
            status: 'renewed',
            newEndDate: renewed.newEndDate
          });
        } else {
          console.log(`[ADMIN_RECURRING] ❌ Payment failed for ${subscription.user.email} - downgrading`);
          await downgradeUser(subscription.user.id);
          await sendDowngradeNotification(subscription.user.email || 'unknown@email.com', 'Recurring payment failed');
          results.failed++;
          results.downgraded++;
          results.details.push({
            user: subscription.user.email,
            status: 'downgraded',
            reason: 'Payment failed'
          });
        }

      } catch (error) {
        console.error(`[ADMIN_RECURRING] Error processing ${subscription.id}:`, error);
        results.failed++;
        results.details.push({
          user: subscription.user.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recurring payments processed',
      results
    });

  } catch (error) {
    console.error('[ADMIN_RECURRING_ERROR]', error);
    return NextResponse.json({ 
      error: 'Failed to process recurring payments' 
    }, { status: 500 });
  }
}

async function renewSubscription(subscription: any, token: string) {
  try {
    console.log(`[ADMIN_RECURRING] 🚀 Starting REAL recurring payment for ${subscription.user.email}`);
    
    // Initialize Netopia client
    const netopia = new NetopiaV2({
      apiKey: process.env.NETOPIA_API_KEY!,
      posSignature: process.env.NETOPIA_POS_SIGNATURE!,
      isProduction: process.env.NODE_ENV === 'production'
    });

    // Generate new order ID for recurring payment
    const newOrderId = `REC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use saved billing data from the user (saved from previous successful payments)
    console.log(`[ADMIN_RECURRING] 📋 Using saved billing data for ${subscription.user.email}`);
    
    const billingInfo = formatBillingInfo({
      firstName: subscription.user.firstName || 'Customer',
      lastName: subscription.user.lastName || 'User', 
      email: subscription.user.email || 'customer@voc.com',
      phone: subscription.user.billingPhone || '0700000000',
      city: subscription.user.billingCity || subscription.user.city || 'București',
      address: subscription.user.billingAddress || 'Strada Exemplu 1',
      postalCode: subscription.user.billingPostalCode || '010000'
    });
    
    console.log(`[ADMIN_RECURRING] 📋 Billing info prepared:`, {
      email: billingInfo.email,
      phone: billingInfo.phone,
      city: billingInfo.city,
      hasSavedAddress: !!subscription.user.billingAddress,
      hasSavedPhone: !!subscription.user.billingPhone
    });

    console.log(`[ADMIN_RECURRING] 💳 Attempting Netopia recurring payment:`, {
      orderID: newOrderId,
      amount: subscription.planModel.price,
      currency: subscription.currency || 'RON',
      userEmail: billingInfo.email,
      tokenLength: token.length
    });

    // Create the order first as PENDING
    const newOrder = await prisma.order.create({
      data: {
        orderId: newOrderId,
        userId: subscription.userId,
        planId: subscription.planId,
        amount: subscription.planModel.price,
        currency: subscription.currency || 'RON',
        subscriptionType: subscription.planModel.name,
        status: 'PENDING', // Start as PENDING until payment confirms
        isRecurring: true,
        token: token
      }
    });

    // Make REAL recurring payment through Netopia
    const paymentResult = await netopia.createRecurringPayment({
      orderID: newOrderId,
      amount: subscription.planModel.price,
      currency: subscription.currency || 'RON',
      description: `Reînnoire automată ${subscription.planModel.name} - ${subscription.user.email}`,
      token: token,
      billing: billingInfo,
      notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/netopia/ipn`
    });

    console.log(`[ADMIN_RECURRING] 📊 Netopia payment result:`, {
      success: paymentResult.success,
      ntpID: paymentResult.ntpID,
      status: paymentResult.status,
      error: paymentResult.error
    });

    if (paymentResult.success) {
      // ✅ Payment successful - update order and extend subscription
      await prisma.order.update({
        where: { id: newOrder.id },
        data: {
          status: 'COMPLETED',
          netopiaId: paymentResult.ntpID,
          paidAt: new Date()
        }
      });

      // Extend subscription by 30 days
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 30);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          endDate: newEndDate,
          updatedAt: new Date()
        }
      });

      console.log(`[ADMIN_RECURRING] ✅ SUCCESSFUL renewal for ${subscription.user.email} until ${newEndDate}`);
      console.log(`[ADMIN_RECURRING] 🆔 Transaction ID: ${paymentResult.ntpID}`);
      
      // Send success notification
      await sendSuccessNotification(billingInfo.email, paymentResult.ntpID || 'N/A', newEndDate);
      
      return { newEndDate, transactionId: paymentResult.ntpID };

    } else {
      // ❌ Payment failed - update order and return failure
      await prisma.order.update({
        where: { id: newOrder.id },
        data: {
          status: 'FAILED',
          errorMessage: paymentResult.error ? JSON.stringify(paymentResult.error) : 'Unknown payment error'
        }
      });

      console.error(`[ADMIN_RECURRING] ❌ FAILED payment for ${subscription.user.email}:`, paymentResult.error);
      
      return null;
    }

  } catch (error) {
    console.error('[ADMIN_RECURRING] ❌ Error in recurring payment process:', error);
    return null;
  }
}

async function downgradeUser(userId: string) {
  try {
    // Update user plan to Basic
    await prisma.user.update({
      where: { id: userId },
      data: { planType: 'Basic' as any }
    });

    // Cancel active subscriptions
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

    console.log(`[ADMIN_RECURRING] Downgraded user ${userId} to Basic plan`);

  } catch (error) {
    console.error('[ADMIN_RECURRING] Error downgrading user:', error);
  }
}

async function sendDowngradeNotification(userEmail: string, reason: string) {
  try {
    // Here you can implement email notification
    // For now, just log it
    console.log(`[ADMIN_RECURRING] 📧 Should send downgrade notification to ${userEmail}: ${reason}`);
    
    // TODO: Implement actual email sending using your preferred service
    // Example with Resend, SendGrid, etc.
    
  } catch (error) {
    console.error('[ADMIN_RECURRING] Error sending downgrade notification:', error);
  }
}

async function sendSuccessNotification(userEmail: string, transactionId: string, newEndDate: Date) {
  try {
    console.log(`[ADMIN_RECURRING] 📧 Should send success notification to ${userEmail}: Transaction ${transactionId}, renewed until ${newEndDate}`);
    
    // TODO: Implement actual email sending
    
  } catch (error) {
    console.error('[ADMIN_RECURRING] Error sending success notification:', error);
  }
}

// GET method to check status
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'admin-secret';
    
    console.log('[DEBUG] Auth Header:', authHeader);
    console.log('[DEBUG] Admin Secret:', adminSecret);
    console.log('[DEBUG] Expected:', `Bearer ${adminSecret}`);
    console.log('[DEBUG] Match:', authHeader === `Bearer ${adminSecret}`);
    
    // Return debug info regardless of auth for testing
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ 
        error: "Unauthorized",
        debug: {
          receivedHeader: authHeader,
          expectedHeader: `Bearer ${adminSecret}`,
          adminSecret: adminSecret
        }
      }, { status: 401 });
    }

    // Get subscriptions that need renewal
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        endDate: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
        }
      },
      include: {
        user: {
          select: {
            email: true,
            planType: true
          }
        },
        planModel: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Subscriptions needing renewal',
      count: expiredSubscriptions.length,
      subscriptions: expiredSubscriptions.map(sub => ({
        id: sub.id,
        userEmail: sub.user.email,
        planName: sub.planModel?.name || 'Unknown',
        planPrice: sub.planModel?.price || 0,
        endDate: sub.endDate,
        daysUntilExpiry: Math.ceil((sub.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }))
    });

  } catch (error) {
    console.error('[ADMIN_RECURRING_GET_ERROR]', error);
    return NextResponse.json({ error: 'Failed to get renewal info' }, { status: 500 });
  }
} 