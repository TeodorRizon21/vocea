import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to check recurring payment state
 * GET /api/test/recurring-check
 */
export async function GET() {
  try {
    console.log('[RECURRING_DEBUG] Checking database state for recurring payments...');

    // Find users with recurring tokens
    const usersWithTokens = await prisma.user.findMany({
      where: {
        recurringToken: {
          not: null
        }
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        planType: true,
        recurringToken: true,
        tokenExpiry: true,
        autoRenewEnabled: true,
        lastRecurringPayment: true,
        billingPhone: true,
        billingCity: true,
        createdAt: true
      }
    });

    // Find active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active'
      },
      include: {
        user: {
          select: {
            clerkId: true,
            email: true,
            recurringToken: true,
            tokenExpiry: true
          }
        },
        planModel: true
      }
    });

    // Find subscriptions expiring soon
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const expiringSoon = await prisma.subscription.findMany({
      where: {
        status: 'active',
        endDate: {
          lte: threeDaysFromNow
        }
      },
      include: {
        user: {
          select: {
            clerkId: true,
            email: true,
            recurringToken: true,
            tokenExpiry: true
          }
        },
        planModel: true
      }
    });

    // Find recent recurring orders
    const recentRecurringOrders = await prisma.order.findMany({
      where: {
        isRecurring: true,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const response = {
      timestamp: new Date().toISOString(),
      summary: {
        usersWithTokens: usersWithTokens.length,
        activeSubscriptions: activeSubscriptions.length,
        expiringSoon: expiringSoon.length,
        recentRecurringOrders: recentRecurringOrders.length
      },
      details: {
        usersWithTokens: usersWithTokens.map(user => ({
          clerkId: user.clerkId,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          planType: user.planType,
          hasToken: !!user.recurringToken,
          tokenExpiry: user.tokenExpiry,
          autoRenewEnabled: user.autoRenewEnabled,
          lastRecurringPayment: user.lastRecurringPayment,
          hasBillingInfo: !!(user.billingPhone && user.billingCity),
          tokenPreview: user.recurringToken ? user.recurringToken.substring(0, 10) + '...' : null
        })),
        expiringSoon: expiringSoon.map(sub => ({
          subscriptionId: sub.id,
          userEmail: sub.user.email,
          plan: sub.plan,
          endDate: sub.endDate,
          daysUntilExpiry: Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          hasToken: !!sub.user.recurringToken,
          tokenExpiry: sub.user.tokenExpiry
        })),
        recentRecurringOrders: await Promise.all(recentRecurringOrders.map(async order => {
          const user = await prisma.user.findFirst({
            where: { id: order.userId },
            select: { email: true }
          });
          return {
            orderId: order.orderId,
            userEmail: user?.email || 'Unknown',
            status: order.status,
            amount: order.amount,
            currency: order.currency,
            createdAt: order.createdAt,
            paidAt: order.paidAt,
            lastError: order.lastError
          };
        }))
      },
      recommendations: [] as string[]
    };

    // Add recommendations based on findings
    if (usersWithTokens.length === 0) {
      response.recommendations.push('No users have recurring tokens saved. Test by making a payment with recurring enabled.');
    }

    if (expiringSoon.length === 0) {
      response.recommendations.push('No subscriptions expiring soon. Create a test subscription with an end date in the next 3 days to test the cron job.');
    }

    if (expiringSoon.length > 0 && expiringSoon.every(sub => !sub.user.recurringToken)) {
      response.recommendations.push('Users with expiring subscriptions don\'t have recurring tokens. The cron job will mark these as expired.');
    }

    if (usersWithTokens.some(user => user.tokenExpiry && new Date(user.tokenExpiry) < new Date())) {
      response.recommendations.push('Some users have expired tokens. These will be skipped by the cron job.');
    }

    console.log('[RECURRING_DEBUG] Database state check completed');
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[RECURRING_DEBUG] Error checking database state:', error);
    return NextResponse.json({
      error: 'Failed to check database state',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}