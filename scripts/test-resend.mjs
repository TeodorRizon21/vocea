import { sendWelcomeEmail, sendPaymentSuccessEmail } from '../lib/resend.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testResendEmails() {
  console.log('Testing Resend email functionality...');
  
  // Test email address - REPLACE WITH YOUR OWN
  const testEmail = process.env.TEST_EMAIL || 'your-email@example.com';
  
  // Test welcome email
  console.log('Sending test welcome email...');
  try {
    const welcomeResult = await sendWelcomeEmail({
      name: 'Test User',
      email: testEmail,
    });
    
    console.log('Welcome email sent:', welcomeResult);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
  
  // Test payment success email
  console.log('Sending test payment success email...');
  try {
    const paymentResult = await sendPaymentSuccessEmail({
      name: 'Test User',
      email: testEmail,
      planName: 'Premium',
      amount: 99.99,
      currency: 'RON',
    });
    
    console.log('Payment success email sent:', paymentResult);
  } catch (error) {
    console.error('Error sending payment success email:', error);
  }
}

// Execute the tests
testResendEmails()
  .then(() => console.log('Resend email tests completed'))
  .catch(err => console.error('Error running Resend email tests:', err))
  .finally(() => process.exit(0)); 