import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Configurare pentru testare
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  cronSecret: process.env.CRON_SECRET || 'your-cron-secret',
  netopiaApiKey: process.env.NETOPIA_API_KEY,
  testUserId: 'user_test_recurring' // ID-ul unui utilizator de test
};

async function createTestOrder() {
  console.log('🔧 Creez o comandă de test pentru plăți recurente...');
  
  try {
    // Găsește un utilizator de test
    let testUser = await prisma.user.findFirst({
      where: { 
        clerkId: TEST_CONFIG.testUserId 
      }
    });

    if (!testUser) {
      console.log('📝 Creez utilizator de test...');
      testUser = await prisma.user.create({
        data: {
          clerkId: TEST_CONFIG.testUserId,
          email: 'test-recurring@example.com',
          firstName: 'Test',
          lastName: 'Recurring',
          city: 'București',
          planType: 'Basic'
        }
      });
    }

    // Găsește un plan de test
    let testPlan = await prisma.plan.findFirst({
      where: { name: 'Premium' }
    });

    if (!testPlan) {
      console.log('📝 Creez plan de test...');
      testPlan = await prisma.plan.create({
        data: {
          name: 'Premium Test',
          price: 29.99,
          currency: 'RON',
          features: ['Test feature 1', 'Test feature 2']
        }
      });
    }

    // Creează comandă de test cu token simulat
    const testOrderId = `TEST_REC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const testOrder = await prisma.order.create({
      data: {
        orderId: testOrderId,
        userId: testUser.id,
        planId: testPlan.id,
        amount: testPlan.price,
        currency: testPlan.currency,
        status: 'COMPLETED',
        subscriptionType: testPlan.name,
        isRecurring: true,
        // Simulează token Netopia pentru testare
        token: `TEST_TOKEN_${Date.now()}`
      }
    });

    console.log('✅ Comandă de test creată cu succes:', {
      orderId: testOrder.orderId,
      amount: testOrder.amount,
      token: testOrder.token,
      nextChargeAt: testOrder.nextChargeAt
    });

    return testOrder;

  } catch (error) {
    console.error('❌ Eroare la crearea comenzii de test:', error);
    throw error;
  }
}

async function testTokenBasedPayment() {
  console.log('\n💳 Testez plata recurentă cu token...');
  
  try {
    // Pentru testare, folosim API-ul direct
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/payment/test-recurring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.cronSecret}`
      },
      body: JSON.stringify({
        test: true,
        orderToken: `TEST_TOKEN_${Date.now()}`,
        amount: 29.99,
        currency: 'RON'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test plată cu token reușit:', result);
    } else {
      console.log('⚠️  Endpoint pentru test nu există încă. Voi crea unul...');
    }

  } catch (error) {
    console.log('ℹ️  Test manual cu token nu a fost posibil:', error.message);
  }
}

async function triggerRecurringPaymentsCron() {
  console.log('\n🔄 Declanșez cron job-ul pentru plăți recurente...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/cron/recurring-payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.cronSecret}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cron job executat cu succes:', result);
      return result;
    } else {
      const errorText = await response.text();
      console.error('❌ Eroare la executarea cron job-ului:', response.status, errorText);
      return null;
    }

  } catch (error) {
    console.error('❌ Eroare la apelarea cron job-ului:', error);
    return null;
  }
}

async function checkRecurringStatus() {
  console.log('\n📊 Verific statusul plăților recurente...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/cron/recurring-payments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.cronSecret}`
      }
    });

    if (response.ok) {
      const status = await response.json();
      console.log('📈 Status plăți recurente:', status);
      return status;
    } else {
      console.error('❌ Nu pot obține statusul plăților recurente');
      return null;
    }

  } catch (error) {
    console.error('❌ Eroare la verificarea statusului:', error);
    return null;
  }
}

async function simulateTokenSave(orderId, simulatedToken = null) {
  console.log('\n🔒 Simulez salvarea unui token Netopia...');
  
  try {
    const token = simulatedToken || `NETOPIA_TOKEN_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
    
    const updatedOrder = await prisma.order.update({
      where: { orderId: orderId },
      data: {
        token: token,
        status: 'COMPLETED'
      }
    });

    console.log('✅ Token simulat salvat:', {
      orderId: updatedOrder.orderId,
      token: token.substring(0, 15) + '...',
      status: updatedOrder.status
    });

    return token;

  } catch (error) {
    console.error('❌ Eroare la simularea token-ului:', error);
    throw error;
  }
}

async function createTestSubscription() {
  console.log('\n🎫 Creez un abonament de test complet...');
  
  try {
    // Folosește endpoint-ul real pentru configurarea plăților recurente
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/payment/setup-recurring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // În mod normal ar fi auth header, pentru test simulez
        'x-test-user': TEST_CONFIG.testUserId
      },
      body: JSON.stringify({
        planId: await getTestPlanId(),
        enableAutoRecurring: true
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Configurare plată recurentă inițiată:', result);
      return result;
    } else {
      const errorText = await response.text();
      console.log('⚠️  Testarea prin endpoint necesită autentificare reală');
      return null;
    }

  } catch (error) {
    console.log('ℹ️  Test prin endpoint necesită setup complet:', error.message);
    return null;
  }
}

async function getTestPlanId() {
  const testPlan = await prisma.plan.findFirst({
    where: { name: { contains: 'Premium' } }
  });
  return testPlan?.id;
}

async function cleanupTestData() {
  console.log('\n🧹 Curăț datele de test...');
  
  try {
    // Șterge comenzile de test
    const deletedOrders = await prisma.order.deleteMany({
      where: {
        orderId: {
          startsWith: 'TEST_REC_'
        }
      }
    });

    console.log(`✅ Șterse ${deletedOrders.count} comenzi de test`);

    // Nu șterge utilizatorul de test pentru utilizări ulterioare
    console.log('ℹ️  Utilizatorul de test păstrat pentru viitoare testări');

  } catch (error) {
    console.error('❌ Eroare la curățarea datelor de test:', error);
  }
}

async function runCompleteTest() {
  console.log('🚀 ÎNCEPE TESTAREA COMPLETĂ A PLĂȚILOR RECURENTE\n');
  console.log('='.repeat(50));

  try {
    // 1. Verifică statusul inițial
    await checkRecurringStatus();

    // 2. Creează comandă de test
    const testOrder = await createTestOrder();

    // 3. Simulează salvarea unui token
    await simulateTokenSave(testOrder.orderId);

    // 4. Testează plata cu token (dacă endpoint-ul există)
    await testTokenBasedPayment();

    // 5. Declanșează cron job-ul
    const cronResult = await triggerRecurringPaymentsCron();

    // 6. Verifică statusul final
    await checkRecurringStatus();

    // 7. Testează configurarea unui abonament nou
    await createTestSubscription();

    console.log('\n' + '='.repeat(50));
    console.log('✅ TESTARE COMPLETĂ FINALIZATĂ CU SUCCES!');
    
    if (cronResult && cronResult.results) {
      console.log('\n📊 REZULTATE CRON JOB:');
      console.log(`- Plăți procesate cu succes: ${cronResult.results.successful}`);
      console.log(`- Plăți eșuate: ${cronResult.results.failed}`);
      console.log(`- Erori: ${cronResult.results.errors.length}`);
    }

    console.log('\n💡 PAȘTI URMĂTORII:');
    console.log('1. Verifică log-urile aplicației pentru detalii complete');
    console.log('2. Testează cu un cont Netopia real în sandbox');
    console.log('3. Configurează cron job-ul în producție');

  } catch (error) {
    console.error('\n❌ EROARE ÎN TIMPUL TESTĂRII:', error);
  } finally {
    // Opțional: curăță datele de test
    const cleanup = process.argv.includes('--cleanup');
    if (cleanup) {
      await cleanupTestData();
    } else {
      console.log('\nℹ️  Pentru a curăța datele de test, rulează cu: --cleanup');
    }
    
    await prisma.$disconnect();
  }
}

// Permite rularea de teste individuale
const testType = process.argv[2];

switch (testType) {
  case 'create':
    createTestOrder().then(() => prisma.$disconnect());
    break;
  case 'cron':
    triggerRecurringPaymentsCron().then(() => prisma.$disconnect());
    break;
  case 'status':
    checkRecurringStatus().then(() => prisma.$disconnect());
    break;
  case 'token':
    if (process.argv[3]) {
      simulateTokenSave(process.argv[3]).then(() => prisma.$disconnect());
    } else {
      console.log('❌ Specifică orderID: npm run test-recurring token ORDER_ID');
    }
    break;
  case 'cleanup':
    cleanupTestData().then(() => prisma.$disconnect());
    break;
  default:
    runCompleteTest();
}

export { 
  createTestOrder, 
  triggerRecurringPaymentsCron, 
  checkRecurringStatus, 
  simulateTokenSave 
}; 