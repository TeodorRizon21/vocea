#!/usr/bin/env node

/**
 * Test Script for Recurring Payments System
 * Run with: node scripts/test-recurring-payments.js
 */

const { execSync } = require('child_process');

console.log('🧪 Testing Recurring Payments System\n');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_RECURRING_SECRET;

if (!CRON_SECRET) {
  console.error('❌ CRON_RECURRING_SECRET environment variable not set!');
  process.exit(1);
}

// Test functions
async function testCronJob() {
  console.log('🔄 Testing Cron Job...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/cron/recurring-payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Cron job executed successfully');
      console.log(`📊 Results: Processed: ${data.results?.processed || 0}, Successful: ${data.results?.successful || 0}, Failed: ${data.results?.failed || 0}`);
    } else {
      console.log('❌ Cron job failed');
    }
  } catch (error) {
    console.error('❌ Error testing cron job:', error.message);
  }
}

async function testAdminEndpoint() {
  console.log('\n📊 Testing Admin Endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/recurring-payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Admin endpoint working');
    } else {
      console.log('❌ Admin endpoint failed');
    }
  } catch (error) {
    console.error('❌ Error testing admin endpoint:', error.message);
  }
}

async function checkDatabaseState() {
  console.log('\n🗄️ Checking Database State...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test/recurring-check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Database State:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Database check endpoint not available (this is normal if not created yet)');
    }
  } catch (error) {
    console.log('ℹ️ Database check endpoint not available');
  }
}

// Run all tests
async function runAllTests() {
  await testCronJob();
  await testAdminEndpoint();
  await checkDatabaseState();
  
  console.log('\n🎯 Test Summary:');
  console.log('1. Check the logs above for any errors');
  console.log('2. If cron job shows "No subscriptions found" - that\'s normal if no users have recurring tokens');
  console.log('3. If you get authentication errors, check your CRON_RECURRING_SECRET');
  console.log('4. For real testing, you need a user with a saved recurring token');
}

// Export for require() usage
if (require.main === module) {
  runAllTests().catch(console.error);
} else {
  module.exports = { testCronJob, testAdminEndpoint, checkDatabaseState };
}