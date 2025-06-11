import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRealTokens() {
  try {
    console.log('🔍 Caut plăți cu token-uri Netopia reale...\n');

    // Găsește toate comenzile (inclusiv fără token pentru a vedea plata Bronze)
    const allOrders = await prisma.order.findMany({
      where: {
        OR: [
          // Comenzi cu token-uri reale
          {
            token: {
              not: null,
              not: {
                startsWith: 'TEST_'
              }
            }
          },
          // Comenzi pentru planul Bronze
          {
            subscriptionType: 'Bronze'
          },
          // Comenzi finalizate recent
          {
            status: 'COMPLETED',
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Ultimele 7 zile
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (allOrders.length === 0) {
      console.log('❌ Nu am găsit comenzi recente.');
      console.log('📝 Pentru a testa recurenta cu sandbox real:');
      console.log('   1. Fă o plată prin aplicație');
      console.log('   2. Completează plata în sandbox Netopia');
      console.log('   3. Verifică că token-ul a fost salvat automat');
      console.log('   4. Apoi testează recurenta\n');
      return;
    }

    console.log(`✅ Am găsit ${allOrders.length} comenzi recente:\n`);

    // Separă comenzile cu și fără token-uri
    const ordersWithTokens = allOrders.filter(order => order.token && !order.token.startsWith('TEST_'));
    const ordersWithoutTokens = allOrders.filter(order => !order.token || order.token.startsWith('TEST_'));

    allOrders.forEach((order, index) => {
      console.log(`${index + 1}. Comanda: ${order.orderId}`);
      console.log(`   💰 Sumă: ${order.amount} ${order.currency}`);
      console.log(`   👤 Utilizator: ${order.user?.email || 'N/A'}`);
      console.log(`   🗓️  Creat: ${order.createdAt.toLocaleDateString('ro-RO')}`);
      console.log(`   📊 Status: ${order.status}`);
      console.log(`   🔑 Token: ${order.token?.substring(0, 20)}...`);
      console.log(`   🔄 Recurent: ${order.isRecurring ? 'Da' : 'Nu'}`);
      console.log('');
    });

    console.log(`\n📊 Sumar: ${ordersWithTokens.length} cu token-uri, ${ordersWithoutTokens.length} fără token-uri\n`);

    // Testează prima comandă cu token dacă există
    if (ordersWithTokens.length > 0) {
      const firstOrder = ordersWithTokens[0];
      console.log(`🧪 Testez plata recurentă cu token pentru: ${firstOrder.orderId}`);
      await testRecurringPayment(firstOrder);
    } else if (ordersWithoutTokens.length > 0) {
      const bronzeOrder = ordersWithoutTokens.find(order => order.subscriptionType === 'Bronze');
      if (bronzeOrder) {
        console.log(`🧪 Am găsit plata Bronze fără token: ${bronzeOrder.orderId}`);
        console.log('💡 Pentru a testa recurenta, această plată are nevoie de un token Netopia.');
        console.log('📝 Soluții:');
        console.log('1. Dacă plata a fost procesată prin Netopia, verifică dacă IPN callback-ul a salvat token-ul');
        console.log('2. Fă o plată nouă în sandbox pentru a obține un token fresh');
        await testCronJob(); // Testează măcar cron job-ul
      }
    }

  } catch (error) {
    console.error('❌ Eroare:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function testRecurringPayment(order) {
  try {
    console.log('🔄 Testez plata recurentă prin API endpoint...');

    // Testează prin endpoint-ul aplicației
    const response = await fetch('http://localhost:3000/api/payment/setup-recurring', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Testarea prin API a fost realizată cu succes!');
      console.log('📊 Rezultat:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('🎉 PLATA RECURENTĂ A FOST PROCESATĂ CU SUCCES!');
        console.log('💳 Payment ID:', result.paymentId);
        console.log('📊 Status:', result.status);
      } else {
        console.log('⚠️  Plata necesită atenție:', result.message);
      }
    } else {
      console.log('❌ Eroare API:', result.error);
      
      // Încearcă testarea directă prin cron
      console.log('🔄 Încerc prin cron job...');
      await testThroughCron(order);
    }

  } catch (error) {
    console.error('❌ Eroare la testarea plății recurente:', error.message);
    console.log('🔄 Încerc prin cron job...');
    await testThroughCron(order);
  }
}

async function testThroughCron(order) {
  try {
    console.log('🔄 Testez prin cron job endpoint...');
    
    const response = await fetch('http://localhost:3000/api/cron/recurring-payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cron job executat cu succes!');
      console.log('📊 Rezultat:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Eroare cron job:', response.status, response.statusText);
      if (response.status === 404) {
        console.log('🚨 Cron endpoint nu există! Să verific...');
        await checkCronEndpoint();
      }
    }

  } catch (error) {
    console.error('❌ Eroare cron job:', error.message);
    console.log('');
    console.log('💡 Pentru testare manuală, poți:');
    console.log('1. Accesa aplicația și fă o plată nouă');
    console.log('2. Completează plata în sandbox Netopia');
    console.log('3. Verifică că token-ul este salvat automat în callback IPN');
    console.log('4. Apoi testează din nou recurenta');
  }
}

async function testCronJob() {
  try {
    console.log('🔄 Testez doar cron job-ul...');
    
    const response = await fetch('http://localhost:3000/api/cron/recurring-payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cron job executat cu succes!');
      console.log('📊 Rezultat:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Eroare cron job:', response.status, response.statusText);
      if (response.status === 404) {
        console.log('🚨 PROBLEMĂ: Cron endpoint nu există!');
        await checkCronEndpoint();
      }
    }

  } catch (error) {
    console.error('❌ Eroare cron job:', error.message);
  }
}

async function checkCronEndpoint() {
  console.log('🔍 Verific dacă fișierul cron există...');
  
  try {
    // Verifică prin import dacă fișierul există
    const fs = await import('fs');
    const path = await import('path');
    
    const cronPath = path.resolve('./app/api/cron/recurring-payments/route.ts');
    const exists = fs.existsSync(cronPath);
    
    if (exists) {
      console.log('✅ Fișierul cron există:', cronPath);
      console.log('🚨 Dar endpoint-ul returnează 404 - verifică sintaxa export-ului');
    } else {
      console.log('❌ Fișierul cron NU există:', cronPath);
      console.log('📝 Trebuie să creez endpoint-ul de cron');
    }
  } catch (error) {
    console.log('❓ Nu pot verifica fișierul cron:', error.message);
  }
}

// Rulează verificarea
checkRealTokens(); 