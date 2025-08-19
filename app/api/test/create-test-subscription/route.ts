import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

/**
 * Create a test subscription that expires soon for testing the cron job
 * POST /api/test/create-test-subscription
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { daysUntilExpiry = 1, planName = 'Bronze' } = body;

    console.log(`[TEST_SUBSCRIPTION] Creating test subscription for user ${userId} expiring in ${daysUntilExpiry} days`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the plan
    const plan = await prisma.plan.findFirst({
      where: { name: planName }
    });

    if (!plan) {
      return NextResponse.json({ error: `Plan ${planName} not found` }, { status: 404 });
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysUntilExpiry);

    // Delete any existing active subscriptions for this user
    await prisma.subscription.deleteMany({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    // Create test subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        plan: plan.name,
        status: 'active',
        startDate: new Date(),
        endDate: endDate,
        amount: plan.price,
        currency: plan.currency
      }
    });

    // Also create a fake recurring token for testing if user doesn't have one
    if (!user.recurringToken) {
      const fakeToken = `test_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tokenExpiry = new Date();
      tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 1); // Token expires in 1 year
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          recurringToken: fakeToken,
          tokenExpiry: tokenExpiry,
          autoRenewEnabled: true,
          // Add some fake billing data for testing
          billingPhone: '0700123456',
          billingAddress: 'Str. Test nr. 1',
          billingCity: 'București',
          billingState: 'București',
          billingPostalCode: '010000',
          billingCountry: 642
        }
      });

      console.log(`[TEST_SUBSCRIPTION] Created fake recurring token for user: ${fakeToken.substring(0, 20)}...`);
    }

    const response = {
      success: true,
      message: 'Test subscription created successfully',
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        endDate: subscription.endDate,
        daysUntilExpiry: daysUntilExpiry
      },
      user: {
        email: user.email,
        hasRecurringToken: !!user.recurringToken || true, // true because we just created one if it didn't exist
        autoRenewEnabled: user.autoRenewEnabled || true
      },
      testInstructions: [
        `Subscription will expire on: ${endDate.toLocaleString('ro-RO')}`,
        'Run the cron job to test automatic renewal:',
        `curl -X POST -H "Authorization: Bearer ${process.env.CRON_RECURRING_SECRET}" ${process.env.NEXT_PUBLIC_APP_URL}/api/cron/recurring-payments`,
        'Or use the test script: node scripts/test-recurring-payments.js'
      ]
    };

    console.log(`[TEST_SUBSCRIPTION] Test subscription created:`, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[TEST_SUBSCRIPTION] Error creating test subscription:', error);
    return NextResponse.json({
      error: 'Failed to create test subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}