#!/usr/bin/env node

/**
 * Quick script to check if recurring tokens are being saved
 * Run with: node scripts/quick-token-check.js
 */

async function checkTokens() {
  console.log('🔍 Checking for recurring tokens in database...\n');

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${BASE_URL}/api/test/recurring-check`);
    const data = await response.json();
    
    console.log('📊 Database Summary:');
    console.log(`- Users with tokens: ${data.summary.usersWithTokens}`);
    console.log(`- Active subscriptions: ${data.summary.activeSubscriptions}`);
    console.log(`- Recent recurring orders: ${data.summary.recentRecurringOrders}`);
    
    if (data.details.usersWithTokens.length > 0) {
      console.log('\n✅ Users with recurring tokens:');
      data.details.usersWithTokens.forEach(user => {
        console.log(`- ${user.email}: ${user.hasToken ? '✅' : '❌'} token, expires: ${user.tokenExpiry || 'N/A'}`);
      });
    } else {
      console.log('\n❌ No users have recurring tokens saved');
      console.log('\n🔧 To fix this:');
      console.log('1. Make a test payment with auto-renewal enabled');
      console.log('2. Complete the payment successfully');
      console.log('3. Check the IPN logs to see if token is received');
      console.log('4. Run this script again');
    }
    
    if (data.details.recentRecurringOrders.length > 0) {
      console.log('\n📋 Recent recurring orders:');
      data.details.recentRecurringOrders.forEach(order => {
        console.log(`- ${order.orderId}: ${order.status} (${order.amount} ${order.currency})`);
      });
    }
    
    if (data.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      data.recommendations.forEach(rec => {
        console.log(`- ${rec}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking tokens:', error.message);
    console.log('\n🔧 Make sure your development server is running:');
    console.log('npm run dev');
  }
}

// Run the check
checkTokens().catch(console.error);