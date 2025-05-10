// A simple script to test the email functionality
import { sendSubscriptionConfirmationEmail, sendPaymentFailedEmail } from '../lib/email.js';

async function testEmails() {
  console.log('Testing email functionality...');
  
  // Test email address - REPLACE WITH YOUR OWN
  const testEmail = 'your-email@example.com';
  
  // Test subscription confirmation email
  console.log('Sending test subscription confirmation email...');
  try {
    const result = await sendSubscriptionConfirmationEmail(
      testEmail,
      {
        name: 'Test User',
        planName: 'Premium',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isRecurring: true,
        language: 'en'
      }
    );
    
    console.log('Subscription confirmation email sent:', result);
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
  }
  
  // Test payment failed email
  console.log('Sending test payment failed email...');
  try {
    const result = await sendPaymentFailedEmail(
      testEmail,
      'Gold',
      'en'
    );
    
    console.log('Payment failed email sent:', result);
  } catch (error) {
    console.error('Error sending payment failed email:', error);
  }
}

// Execute the tests
testEmails()
  .then(() => console.log('Email tests completed'))
  .catch(err => console.error('Error running email tests:', err))
  .finally(() => process.exit(0)); 