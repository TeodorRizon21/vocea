#!/usr/bin/env node

/**
 * Script to test the NEW cron job logic that handles both active and recently expired subscriptions
 * Run with: node scripts/test-new-cron-logic.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewCronLogic() {
  console.log('🧪 Testing NEW cron job logic (active + recently expired)...\n');

  try {
    // Get current time boundaries
    const now = new Date();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    console.log('📅 Time boundaries:');
    console.log(`   Now: ${now.toISOString()}`);
    console.log(`   3 days from now: ${threeDaysFromNow.toISOString()}`);
    console.log(`   3 days ago: ${threeDaysAgo.toISOString()}\n`);

    // Test NEW cron job query with OR logic (same as updated cron job)
    const subscriptionsFound = await prisma.subscription.findMany({
      where: {
        OR: [
          {
            // Active subscriptions expiring within 3 days
            status: 'active',
            endDate: {
              lte: threeDaysFromNow
            }
          },
          {
            // Recently expired subscriptions (within last 3 days) that can still be renewed
            status: 'expired',
            endDate: {
              gte: threeDaysAgo, // Expired within last 3 days
              lte: now // But actually expired (not future dated)
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            email: true,
            planType: true,
            recurringToken: true,
            tokenExpiry: true
          }
        }
      }
    });

    console.log('🤖 NEW Cron Job Logic Results:');
    if (subscriptionsFound.length === 0) {
      console.log('   ❌ No subscriptions found');
      console.log('   This means either:');
      console.log('     • No active subscriptions expiring within 3 days');
      console.log('     • No expired subscriptions from the last 3 days');
    } else {
      console.log(`   ✅ Found ${subscriptionsFound.length} subscription(s):`);
      subscriptionsFound.forEach((sub, index) => {
        const isExpired = sub.endDate < now;
        console.log(`\n   ${index + 1}. ${sub.user.email}`);
        console.log(`      Plan: ${sub.plan}`);
        console.log(`      Status: ${sub.status}`);
        console.log(`      End Date: ${sub.endDate.toISOString()}`);
        console.log(`      Actually Expired: ${isExpired ? '✅ YES' : '❌ NO'}`);
        console.log(`      User Plan Type: ${sub.user.planType}`);
        console.log(`      Has Token: ${!!sub.user.recurringToken}`);
        console.log(`      Token Expires: ${sub.user.tokenExpiry || 'N/A'}`);
        console.log(`      Will Process: ${!!sub.user.recurringToken ? '✅ YES' : '❌ NO (no token)'}`);
      });
    }

    console.log(`\n💡 The updated cron job now processes:`);
    console.log(`   1. Active subscriptions expiring within 3 days`);
    console.log(`   2. Expired subscriptions from the last 3 days`);
    console.log(`\n🎯 This solves the problem where subscriptions expired yesterday`);
    console.log(`   would be missed by today's cron job!`);

  } catch (error) {
    console.error('❌ Error testing new cron logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewCronLogic().catch(console.error);