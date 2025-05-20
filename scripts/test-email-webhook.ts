import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define response types
interface SuccessResponse {
  success: true;
  message: string;
  result: boolean;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type WebhookResponse = SuccessResponse | ErrorResponse;

async function testEmailWebhook() {
  console.log('🧪 Starting email webhook test...\n');

  // Test email address - REPLACE WITH YOUR OWN
  const testEmail = process.env.TEST_EMAIL;
  
  if (!testEmail) {
    console.error('❌ TEST_EMAIL environment variable is not set');
    console.log('Please add TEST_EMAIL=your-email@example.com to your .env file');
    process.exit(1);
  }

  console.log('📧 Test email address:', testEmail);
  console.log('🌐 Testing webhook endpoint...\n');

  try {
    const response = await fetch('http://localhost:3000/api/test/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        firstName: 'Test User'
      })
    });

    const data = await response.json() as WebhookResponse;
    
    console.log('📨 Response:', data);
    
    if (data.success) {
      console.log('\n✅ Test completed successfully!');
      console.log('Please check your email inbox for the test email.');
      console.log('If you don\'t see it within a few minutes, check your spam folder.');
    } else {
      console.error('\n❌ Test failed:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Error running test:', error);
  }
}

// Run the test
testEmailWebhook()
  .then(() => {
    console.log('\n✨ Test script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error running test script:', err);
    process.exit(1);
  }); 