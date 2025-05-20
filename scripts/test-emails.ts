import { sendWelcomeEmail, sendPaymentSuccessEmail } from '../lib/resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug logging
console.log('Environment variables loaded:');
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length);
console.log('TEST_EMAIL:', process.env.TEST_EMAIL);

async function testEmails() {
  console.log('Starting email tests...\n');
  
  // Test email address - REPLACE WITH YOUR OWN
  const testEmail = process.env.TEST_EMAIL;
  
  if (!testEmail) {
    console.error('❌ TEST_EMAIL environment variable is not set');
    console.log('Please add TEST_EMAIL=your-email@example.com to your .env file');
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY environment variable is not set');
    console.log('Please add RESEND_API_KEY=your_resend_api_key to your .env file');
    process.exit(1);
  }

  console.log('📧 Test email address:', testEmail);
  console.log('🔑 Resend API key is configured\n');

  // Test 1: Welcome Email
  console.log('🧪 Test 1: Welcome Email');
  console.log('------------------------');
  try {
    const welcomeResult = await sendWelcomeEmail({
      name: 'Test User',
      email: testEmail,
    });
    
    if (welcomeResult) {
      console.log('✅ Welcome email sent successfully');
    } else {
      console.error('❌ Failed to send welcome email');
    }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
  console.log('');

  // Test 2: Payment Success Email
  console.log('🧪 Test 2: Payment Success Email');
  console.log('------------------------');
  try {
    const paymentResult = await sendPaymentSuccessEmail({
      name: 'Test User',
      email: testEmail,
      planName: 'Premium',
      amount: 99.99,
      currency: 'RON',
    });
    
    if (paymentResult) {
      console.log('✅ Payment success email sent successfully');
    } else {
      console.error('❌ Failed to send payment success email');
    }
  } catch (error) {
    console.error('❌ Error sending payment success email:', error);
  }
  console.log('\n📝 Test Summary:');
  console.log('----------------');
  console.log('Please check your email inbox for the test emails.');
  console.log('If you don\'t receive them within a few minutes, check your spam folder.');
  console.log('Also check the Resend dashboard for any delivery issues.');
}

// Execute the tests
testEmails()
  .then(() => {
    console.log('\n✨ Email tests completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error running email tests:', err);
    process.exit(1);
  }); 