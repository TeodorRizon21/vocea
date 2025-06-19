const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { NetopiaV2 } = require('./lib/netopia-v2');

async function quickCheck() {
  try {
    console.log('🔍 VERIFICARE RAPIDĂ - UTILIZATORI ȘI COMENZI\n');
    
    // 1. Verifică utilizatori Gold
    const goldUsers = await prisma.user.findMany({
      where: { planType: 'Gold' }
    });
    
    console.log(`👥 UTILIZATORI GOLD: ${goldUsers.length}\n`);
    
    for (const user of goldUsers) {
      console.log(`📧 ${user.email}`);
      console.log(`🔑 Token recurent: ${user.recurringToken ? 'DA' : 'NU'}`);
      if (user.recurringToken) {
        console.log(`   Token: ${user.recurringToken.substring(0, 30)}...`);
        console.log(`   Expiră: ${user.tokenExpiry || 'Nu știu'}`);
      }
      console.log('');
    }
    
    // 2. Verifică comenzile cu token
    console.log('💳 COMENZI CU TOKEN PENTRU PLĂȚI RECURENTE:\n');
    
    const ordersWithToken = await prisma.order.findMany({
      where: {
        token: { not: null },
        status: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📊 Găsite: ${ordersWithToken.length} comenzi cu token\n`);
    
    for (const order of ordersWithToken) {
      const user = await prisma.user.findUnique({
        where: { clerkId: order.userId }
      });
      
      console.log(`💳 ${order.orderId}`);
      console.log(`   👤 User: ${user?.email || 'Unknown'}`);
      console.log(`   💰 Sumă: ${order.amount} ${order.currency}`);
      console.log(`   📅 Data: ${order.createdAt.toLocaleDateString('ro-RO')}`);
      console.log(`   🔑 Token: ${order.token.substring(0, 30)}...`);
      console.log(`   🏦 Netopia ID: ${order.netopiaId || 'N/A'}`);
      console.log('');
    }
    
    // 3. Ultimele comenzi recurente
    console.log('🔄 ULTIMELE COMENZI RECURENTE:\n');
    
    const recurringOrders = await prisma.order.findMany({
      where: { isRecurring: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`📊 Găsite: ${recurringOrders.length} comenzi recurente\n`);
    
    for (const order of recurringOrders) {
      const user = await prisma.user.findUnique({
        where: { clerkId: order.userId }
      });
      
      console.log(`🔄 ${order.orderId}`);
      console.log(`   👤 User: ${user?.email || 'Unknown'}`);
      console.log(`   💰 Sumă: ${order.amount} ${order.currency}`);
      console.log(`   📊 Status: ${order.status}`);
      console.log(`   📅 Data: ${order.createdAt.toLocaleString('ro-RO')}`);
      console.log('');
    }
    
    // 4. Sumar sistemului
    console.log('📋 SUMAR SISTEM PLĂȚI RECURENTE:\n');
    
    const totalUsers = await prisma.user.count();
    const goldUserCount = goldUsers.length;
    const usersWithTokens = goldUsers.filter(u => u.recurringToken).length;
    const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });
    const recurringOrderCount = recurringOrders.length;
    
    console.log(`👥 Total utilizatori: ${totalUsers}`);
    console.log(`🏆 Utilizatori Gold: ${goldUserCount}`);
    console.log(`🔑 Utilizatori cu token-uri recurente: ${usersWithTokens}`);
    console.log(`💳 Total comenzi completate: ${completedOrders}`);
    console.log(`🔄 Comenzi recurente: ${recurringOrderCount}`);
    
    console.log('\n🎯 CONCLUZIE:');
    if (usersWithTokens > 0) {
      console.log('✅ Sistemul are utilizatori cu token-uri recurente!');
      console.log('✅ Poate fi testat pentru plăți automate');
      console.log(`✅ ${usersWithTokens} utilizatori pot primi plăți recurente`);
    } else {
      console.log('⚠️  Nu există utilizatori cu token-uri recurente');
      console.log('💡 Trebuie să faci o plată prin Netopia pentru a obține token');
    }
    
  } catch (error) {
    console.error('❌ Eroare:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkLastSub() {
  try {
    // Găsește ultima plată SUB reușită
    const lastSubOrder = await prisma.order.findFirst({
      where: {
        orderId: {
          startsWith: 'SUB_'
        },
        status: 'COMPLETED',
        token: {
          not: null
        }
      },
      include: {
        user: true,
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Ultima plată SUB reușită:', {
      orderId: lastSubOrder.orderId,
      amount: lastSubOrder.amount,
      createdAt: lastSubOrder.createdAt,
      token: lastSubOrder.token ? '✅ Available' : '❌ Missing',
      userName: `${lastSubOrder.user.firstName} ${lastSubOrder.user.lastName}`,
      planName: lastSubOrder.plan.name
    });

    // Găsește abonamentul activ al utilizatorului
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: lastSubOrder.userId,
        status: 'active'
      },
      include: {
        planModel: true,
        user: true
      }
    });

    if (activeSubscription) {
      console.log('Detalii abonament activ:', {
        id: activeSubscription.id,
        status: activeSubscription.status,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        planName: activeSubscription.planModel.name,
        amount: activeSubscription.amount,
        userName: `${activeSubscription.user.firstName} ${activeSubscription.user.lastName}`
      });
    } else {
      console.log('Nu s-a găsit niciun abonament activ pentru acest utilizator');
    }

  } catch (error) {
    console.error('Eroare:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function forceExpireSubscription() {
  try {
    // Mai întâi găsim toți utilizatorii pentru a identifica clerkId-ul corect
    const users = await prisma.user.findMany({
      where: {
        email: 'grizzlymediapro@gmail.com'
      }
    });

    if (users.length === 0) {
      console.log('Utilizatorul nu a fost găsit');
      return;
    }

    const user = users[0];
    console.log('User găsit:', {
      id: user.id,
      email: user.email,
      clerkId: user.clerkId,
      planType: user.planType
    });

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      },
      include: {
        planModel: true
      }
    });

    if (!subscription) {
      console.log('Nu s-a găsit niciun abonament activ pentru acest utilizator');
      return;
    }

    console.log('Abonament curent:', {
      id: subscription.id,
      status: subscription.status,
      endDate: subscription.endDate,
      planName: subscription.planModel.name,
      amount: subscription.amount
    });

    // Setează data de expirare în trecut (ieri)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        endDate: yesterday
      }
    });

    console.log('Abonament actualizat:', {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      endDate: updatedSubscription.endDate
    });

  } catch (error) {
    console.error('Eroare:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createAndExpireSubscription() {
  try {
    // Găsește utilizatorul
    const users = await prisma.user.findMany({
      where: {
        email: 'grizzlymediapro@gmail.com'
      }
    });

    if (users.length === 0) {
      console.log('Utilizatorul nu a fost găsit');
      return;
    }

    const user = users[0];
    console.log('User găsit:', {
      id: user.id,
      email: user.email,
      clerkId: user.clerkId,
      planType: user.planType
    });

    // Găsește comanda FINAL_REAL reușită
    const lastOrder = await prisma.order.findFirst({
      where: {
        userId: user.clerkId,
        orderId: {
          contains: 'FINAL_REAL'
        },
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        plan: true
      }
    });

    if (!lastOrder) {
      console.log('Nu s-a găsit comanda FINAL_REAL reușită');
      return;
    }

    console.log('Comanda FINAL_REAL găsită:', {
      orderId: lastOrder.orderId,
      amount: lastOrder.amount,
      planName: lastOrder.plan?.name,
      createdAt: lastOrder.createdAt,
      token: lastOrder.token ? '✅ Available' : '❌ Missing'
    });

    // Verifică dacă există deja un abonament activ
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.clerkId,
        status: 'active'
      }
    });

    if (existingSubscription) {
      console.log('Există deja un abonament activ. Se va dezactiva.');
      await prisma.subscription.update({
        where: {
          id: existingSubscription.id
        },
        data: {
          status: 'expired'
        }
      });
    }

    // Creează un nou abonament
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.clerkId,
        planId: lastOrder.planId,
        plan: lastOrder.plan.name,
        amount: lastOrder.amount,
        currency: lastOrder.currency || 'RON',
        status: 'active',
        startDate: yesterday,
        endDate: yesterday, // Setăm direct ca expirat
        orderId: lastOrder.id
      }
    });

    console.log('Abonament creat și setat ca expirat:', {
      id: subscription.id,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      planName: subscription.plan,
      amount: subscription.amount
    });

    // Actualizează planul utilizatorului
    await prisma.user.update({
      where: {
        clerkId: user.clerkId
      },
      data: {
        planType: lastOrder.plan.name
      }
    });

    console.log('Plan utilizator actualizat la:', lastOrder.plan.name);

    // Acum să rulăm cron-ul pentru a procesa plata recurentă
    console.log('Se rulează cron-ul pentru procesarea plății recurente...');

    const response = await fetch('http://localhost:3000/api/cron/recurring-payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });

    const result = await response.json();
    console.log('Rezultat cron:', result);

  } catch (error) {
    console.error('Eroare:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testRecurringPayment() {
  const netopia = new NetopiaV2({
    apiKey: process.env.NETOPIA_API_KEY,
    posSignature: process.env.NETOPIA_POS_SIGNATURE,
    isProduction: process.env.NODE_ENV === 'production'
  });

  const testToken = process.env.TEST_RECURRING_TOKEN;
  if (!testToken) {
    console.error('Please set TEST_RECURRING_TOKEN in your environment');
    process.exit(1);
  }

  try {
    const result = await netopia.createRecurringPayment({
      orderID: `TEST_RECURRING_${Date.now()}`,
      amount: 1, // Test amount of 1 RON
      currency: 'RON',
      description: 'Test recurring payment with MIT exemption',
      token: testToken,
      billing: {
        email: 'test@example.com',
        phone: '0700000000',
        firstName: 'Test',
        lastName: 'User',
        city: 'București',
        country: '642',
        state: 'București',
        postalCode: '010000',
        details: 'Test Address',
        address: 'Test Address'
      },
      notifyUrl: 'https://your-domain.com/api/netopia/ipn'
    });

    console.log('Recurring payment result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error testing recurring payment:', error);
  }
}

quickCheck();
checkLastSub();
forceExpireSubscription();
createAndExpireSubscription();
testRecurringPayment(); 