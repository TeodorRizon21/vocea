import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
          await downgradeUser(subscription.user.id);
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
          await downgradeUser(subscription.user.id);
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
    // Create new order for recurring payment
    const newOrderId = `REC_${Date.now()}`;
    
    const newOrder = await prisma.order.create({
      data: {
        orderId: newOrderId,
        userId: subscription.userId,
        planId: subscription.planId,
        amount: subscription.planModel.price,
        currency: subscription.currency || 'RON',
        subscriptionType: subscription.planModel.name,
        status: 'COMPLETED', // For testing, mark as completed immediately
        isRecurring: true,
        token: token
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

    console.log(`[ADMIN_RECURRING] Renewed subscription for ${subscription.user.email} until ${newEndDate}`);
    
    return { newEndDate };

  } catch (error) {
    console.error('[ADMIN_RECURRING] Error renewing subscription:', error);
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

// GET method to check status
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'admin-secret';
    
    console.log('[DEBUG] Auth Header:', authHeader);
    console.log('[DEBUG] Admin Secret:', adminSecret);
    console.log('[DEBUG] Expected:', `Bearer ${adminSecret}`);
    console.log('[DEBUG] Match:', authHeader === `Bearer ${adminSecret}`);
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        planName: sub.planModel.name,
        planPrice: sub.planModel.price,
        endDate: sub.endDate,
        daysUntilExpiry: Math.ceil((sub.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }))
    });

  } catch (error) {
    console.error('[ADMIN_RECURRING_GET_ERROR]', error);
    return NextResponse.json({ error: 'Failed to get renewal info' }, { status: 500 });
  }
} 