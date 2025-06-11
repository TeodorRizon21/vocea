import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNewPaymentRecurring() {
  try {
    console.log('🎯 TESTEZ RECURENTA PE NOUA PLATĂ!\n');

    // Găsește noua plată
    const newPayment = await prisma.order.findFirst({
      where: {
        orderId: 'SUB_1749660885981',
        status: 'COMPLETED'
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!newPayment) {
      console.log('❌ Nu am găsit plata SUB_1749660885981');
      return;
    }

    console.log('✅ Plată găsită:');
    console.log(`   🆔 ID: ${newPayment.orderId}`);
    console.log(`   💰 Sumă: ${newPayment.amount} ${newPayment.currency}`);
    console.log(`   👤 User: ${newPayment.user?.email}`);
    console.log(`   📊 Status: ${newPayment.status}`);
    console.log(`   🔑 Token actual: ${newPayment.token || 'LIPSEȘTE'}`);

    // Adaugă token mock pentru testare
    console.log('\n🔧 Adaug token mock pentru testare...');
    const mockToken = `REAL_TEST_TOKEN_${Date.now()}_FOR_RECURRING`;
    
    const updatedOrder = await prisma.order.update({
      where: { id: newPayment.id },
      data: { token: mockToken }
    });

    console.log('✅ Token mock adăugat:', mockToken.substring(0, 30) + '...');

    // Testează recurenta prin API
    console.log('\n🔄 Testez plata recurentă cu noul token...');
    
    try {
      const response = await fetch('http://localhost:3000/api/payment/setup-recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: newPayment.orderId,
          amount: newPayment.amount,
          currency: newPayment.currency
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🎉 SUCCESS! Plata recurentă a fost testată:');
        console.log('📊 Rezultat:', JSON.stringify(result, null, 2));
      } else {
        console.log('⚠️  API răspuns:', response.status, await response.text());
      }
    } catch (apiError) {
      console.log('❌ Eroare API:', apiError.message);
    }

    // Testează și prin cron (dacă funcționează)
    console.log('\n🕐 Încerc și prin cron job...');
    try {
      const cronResponse = await fetch('http://localhost:3000/api/cron/recurring-payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          'Content-Type': 'application/json'
        }
      });

      if (cronResponse.ok) {
        const cronResult = await cronResponse.json();
        console.log('✅ Cron job executat:', cronResult);
      } else {
        console.log('⚠️  Cron job eșuat:', cronResponse.status);
      }
    } catch (cronError) {
      console.log('❌ Eroare cron:', cronError.message);
    }

    // Verifică dacă s-au creat plăți noi
    console.log('\n📊 Verific ultimele plăți...');
    const recentOrders = await prisma.order.findMany({
      where: {
        userId: newPayment.userId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Ultimele 5 minute
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Găsite ${recentOrders.length} plăți în ultimele 5 minute:`);
    recentOrders.forEach((order, i) => {
      console.log(`${i + 1}. ${order.orderId} - ${order.status} - ${order.amount} RON - ${order.token ? 'Cu token' : 'Fără token'}`);
    });

  } catch (error) {
    console.error('❌ Eroare:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Rulează testul
testNewPaymentRecurring(); 