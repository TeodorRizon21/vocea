import fetch from 'node-fetch';

async function testPayment() {
  try {
    console.log('Initiating recurring payment test...');
    
    // Get the Clerk session token from environment variable
    const clerkToken = process.env.CLERK_SESSION_TOKEN;
    if (!clerkToken) {
      console.error('Please set CLERK_SESSION_TOKEN environment variable');
      return;
    }
    
    const response = await fetch('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clerkToken}`
      },
      body: JSON.stringify({
        subscriptionType: 'Premium',
        isRecurring: true,
        billingInfo: {
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          phone: "1234567890",
          address: "Test Address"
        }
      })
    });

    const data = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testPayment(); 