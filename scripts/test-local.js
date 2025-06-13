// Test local pentru plăți recurente
async function testLocalRecurringPayments() {
  console.log('🧪 Testing Recurring Payments API locally...');
  
  const baseUrl = 'http://localhost:3000';
  const adminSecret = 'admin-secret'; // Sau ADMIN_SECRET din .env
  
  try {
    // Test GET - verifică abonamentele care expiră
    console.log('\n📊 Checking subscriptions needing renewal...');
    const getResponse = await fetch(`${baseUrl}/api/admin/recurring-payments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminSecret}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ GET Success:', JSON.stringify(getResult, null, 2));
      
      if (getResult.count > 0) {
        console.log(`\n💰 Found ${getResult.count} subscriptions needing renewal`);
        
        // Test POST - procesează plățile
        console.log('\n🔄 Processing recurring payments...');
        const postResponse = await fetch(`${baseUrl}/api/admin/recurring-payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminSecret}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (postResponse.ok) {
          const postResult = await postResponse.json();
          console.log('✅ POST Success:', JSON.stringify(postResult, null, 2));
          
          if (postResult.success) {
            console.log(`\n📊 Results:`);
            console.log(`   - Processed: ${postResult.results.processed}`);
            console.log(`   - Successful: ${postResult.results.successful}`);
            console.log(`   - Failed: ${postResult.results.failed}`);
            console.log(`   - Downgraded: ${postResult.results.downgraded}`);
          }
        } else {
          console.error('❌ POST Failed:', postResponse.status, await postResponse.text());
        }
      } else {
        console.log('✅ No subscriptions need renewal at this time');
      }
    } else {
      console.error('❌ GET Failed:', getResponse.status, await getResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Rulează testul
testLocalRecurringPayments(); 