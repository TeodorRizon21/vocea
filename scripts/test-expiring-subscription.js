#!/usr/bin/env node

/**
 * Script to create a test subscription that expires in 1 hour
 * This allows testing the cron job for automatic recurring payments
 * Run with: node scripts/test-expiring-subscription.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createExpiringSubscription() {
  console.log('🕐 Setting up test subscription to expire in 1 hour...\n');

  try {
    // Find the user with a recurring token
    const userWithToken = await prisma.user.findFirst({
      where: {
        recurringToken: { not: null }
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        recurringToken: true,
        tokenExpiry: true,
        planType: true
      }
    });

    if (!userWithToken) {
      console.error('❌ No user with recurring token found!');
      console.log('💡 Make a payment with recurring enabled first.');
      return;
    }

    console.log('✅ Found user with token:', userWithToken.email);
    console.log(`   Token expires: ${userWithToken.tokenExpiry}`);
    console.log(`   Current plan: ${userWithToken.planType}\n`);

    // Calculate expiry time (1 hour from now)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    console.log(`🕐 Setting subscription to expire at: ${oneHourFromNow.toISOString()}\n`);

    // Find or create an active subscription for this user
    let subscription = await prisma.subscription.findFirst({
      where: {
        userId: userWithToken.id,
        status: 'active'
      }
    });

    if (subscription) {
      // Update existing subscription to expire in 1 hour
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          endDate: oneHourFromNow,
          status: 'active'
        }
      });
      console.log('✅ Updated existing subscription to expire in 1 hour');
    } else {
      // Create new subscription that expires in 1 hour
      subscription = await prisma.subscription.create({
        data: {
          userId: userWithToken.id,
          plan: userWithToken.planType || 'Gold',
          status: 'active',
          startDate: new Date(),
          endDate: oneHourFromNow
        }
      });
      console.log('✅ Created new subscription that expires in 1 hour');
    }

    console.log(`\n📋 Test Subscription Details:`);
    console.log(`   ID: ${subscription.id}`);
    console.log(`   User: ${userWithToken.email}`);
    console.log(`   Plan: ${subscription.plan}`);
    console.log(`   Expires: ${subscription.endDate.toISOString()}`);
    console.log(`   Status: ${subscription.status}`);

    console.log(`\n🧪 Testing Instructions:`);
    console.log(`1. Wait about 5-10 minutes`);
    console.log(`2. Run the cron job manually:`);
    console.log(`   curl -X POST \\`);
    console.log(`     -H "Authorization: Bearer ${process.env.CRON_RECURRING_SECRET}" \\`);
    console.log(`     http://localhost:3001/api/cron/recurring-payments`);
    console.log(`3. Check the logs for automatic recurring payment processing`);
    console.log(`4. Verify the subscription was extended by 30 days`);

    console.log(`\n⏰ The cron job looks for subscriptions expiring within 3 days, so this subscription will be picked up!`);

  } catch (error) {
    console.error('❌ Error setting up test subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
createExpiringSubscription().catch(console.error);