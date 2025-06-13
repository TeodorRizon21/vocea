import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  cronSecret: process.env.CRON_SECRET || 'your-cron-secret',
  netopiaApiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://secure.mobilpay.ro' 
    : 'https://secure.sandbox.netopia-payments.com'
};

async function processRecurringPayments() {
  try {
    console.log('🔄 Starting recurring payments processing...');
    console.log('📅 Current time:', new Date().toISOString());

    // Find all active subscriptions that have ended or are ending today
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        endDate: {
          lte: new Date() // Subscriptions that have ended
        }
      },
      include: {
        user: true,
        planModel: true
      }
    });

    console.log(`📊 Found ${expiredSubscriptions.length} expired subscriptions to process`);

    if (expiredSubscriptions.length === 0) {
      console.log('✅ No subscriptions need renewal at this time');
      return;
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      downgraded: 0,
      errors: []
    };

    for (const subscription of expiredSubscriptions) {
      try {
        results.processed++;
        
        console.log(`\n🔄 Processing subscription ${subscription.id}`);
        console.log(`👤 User: ${subscription.user.email}`);
        console.log(`📦 Plan: ${subscription.planModel.name} (${subscription.planModel.price} ${subscription.currency})`);
        console.log(`📅 Expired: ${subscription.endDate.toISOString()}`);

        // Get the most recent completed order for this user to check for token
        const lastOrder = await prisma.order.findFirst({
          where: {
            userId: subscription.userId,
            status: 'COMPLETED',
            isRecurring: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Check if we have a token for recurring payments
        const hasToken = lastOrder?.token;
        
        if (!hasToken) {
          console.log(`❌ No recurring token found for user ${subscription.user.email}`);
          console.log('⬇️ Downgrading to Basic plan...');
          
          await downgradeUserToBasic(subscription.user.id, subscription.user.email);
          results.failed++;
          results.downgraded++;
          results.errors.push(`No token for ${subscription.user.email}`);
          continue;
        }

        console.log(`🔑 Found token for recurring payment: ${hasToken.substring(0, 20)}...`);

        // Create a new recurring payment
        const success = await processRecurringPayment(subscription, lastOrder.token);
        
        if (success) {
          console.log(`✅ Successfully renewed subscription for ${subscription.user.email}`);
          results.successful++;
        } else {
          console.log(`❌ Failed to renew subscription for ${subscription.user.email}`);
          console.log('⬇️ Downgrading to Basic plan...');
          
          await downgradeUserToBasic(subscription.user.id, subscription.user.email);
          results.failed++;
          results.downgraded++;
          results.errors.push(`Payment failed for ${subscription.user.email}`);
        }

      } catch (error) {
        console.error(`❌ Error processing subscription ${subscription.id}:`, error);
        
        await downgradeUserToBasic(subscription.user.id, subscription.user.email);
        results.failed++;
        results.downgraded++;
        results.errors.push(`Error: ${error.message}`);
      }
    }

    console.log('\n📊 FINAL RESULTS:');
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Successful: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Downgraded: ${results.downgraded}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n✅ Recurring payments processing completed');

  } catch (error) {
    console.error('💥 Fatal error in recurring payments processing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function processRecurringPayment(subscription, token) {
  try {
    // Generate new order ID
    const newOrderId = `REC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`💳 Creating recurring payment with order ID: ${newOrderId}`);

    // Create new order record
    const newOrder = await prisma.order.create({
      data: {
        orderId: newOrderId,
        userId: subscription.userId,
        planId: subscription.planId,
        amount: subscription.planModel.price,
        currency: subscription.currency || 'RON',
        subscriptionType: subscription.planModel.name,
        status: 'PENDING',
        isRecurring: true,
        token: token // Store the token for this payment
      }
    });

    // Prepare payment request to Netopia
    const paymentRequest = {
      token: token,
      amount: subscription.planModel.price,
      currency: subscription.currency || 'RON',
      orderID: newOrderId,
      billing: {
        firstName: subscription.user.firstName || 'Customer',
        lastName: subscription.user.lastName || 'User',
        email: subscription.user.email,
        phone: '0700000000', // Default phone
        address: 'Default Address',
        city: subscription.user.city || 'București',
        country: 'Romania',
        postalCode: '010000'
      }
    };

    console.log(`📤 Sending payment request to Netopia...`);

    // Make the recurring payment request
    const response = await fetch(`${CONFIG.netopiaApiUrl}/payment/card/recurrent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NETOPIA_API_KEY
      },
      body: JSON.stringify(paymentRequest)
    });

    const result = await response.json();

    if (response.ok && !result.error) {
      console.log(`✅ Payment successful! Transaction ID: ${result.payment?.ntpID}`);
      
      // Update order to completed
      await prisma.order.update({
        where: { id: newOrder.id },
        data: {
          status: 'COMPLETED',
          transactionId: result.payment?.ntpID
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

      console.log(`📅 Subscription extended until: ${newEndDate.toISOString()}`);
      return true;

    } else {
      console.error(`❌ Payment failed:`, result.error || result);
      
      // Update order to failed
      await prisma.order.update({
        where: { id: newOrder.id },
        data: {
          status: 'FAILED'
        }
      });

      return false;
    }

  } catch (error) {
    console.error('❌ Error in processRecurringPayment:', error);
    return false;
  }
}

async function downgradeUserToBasic(userId, userEmail) {
  try {
    console.log(`⬇️ Downgrading user ${userEmail} to Basic plan...`);
    
    // Update user plan type
    await prisma.user.update({
      where: { id: userId },
      data: {
        planType: 'Basic'
      }
    });

    // Cancel all active subscriptions
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

    console.log(`✅ User ${userEmail} successfully downgraded to Basic plan`);

  } catch (error) {
    console.error(`❌ Error downgrading user ${userEmail}:`, error);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  processRecurringPayments();
}

export { processRecurringPayments }; 