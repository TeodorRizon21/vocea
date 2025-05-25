import fetch from 'node-fetch';

async function testRecurringPayment() {
  try {
    console.log('Testing recurring payment renewal...');
    
    const response = await fetch('http://localhost:3000/api/cron/charge-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', text);
  } catch (error) {
    console.error('Error testing recurring payment:', error);
  }
}

testRecurringPayment(); 