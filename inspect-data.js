import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectData() {
  try {
    console.log('🔍 INSPECTEZ DATELE DIN BAZA DE DATE...\n');

    // 1. Verifică users
    console.log('👥 USERS:');
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    for (const user of users) {
      console.log(`   📝 ID: ${user.id}`);
      console.log(`   🔑 ClerkId: ${user.clerkId}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   ─────────────────────────`);
    }

    // 2. Verifică subscriptions RAW (fără joins)
    console.log('\n📋 SUBSCRIPTIONS (RAW):');
    try {
      const subscriptionsRaw = await prisma.$queryRaw`
        db.Subscription.find({}).limit(3)
      `;
      console.log('Subscriptions RAW:', JSON.stringify(subscriptionsRaw, null, 2));
    } catch (error) {
      console.log('❌ Eroare query RAW subscriptions:', error.message);
    }

    // 3. Verifică orders RAW
    console.log('\n💳 ORDERS (RAW):');
    try {
      const ordersRaw = await prisma.$queryRaw`
        db.Order.find({}).limit(3)
      `;
      console.log('Orders RAW:', JSON.stringify(ordersRaw, null, 2));
    } catch (error) {
      console.log('❌ Eroare query RAW orders:', error.message);
    }

    // 4. Verifică plans
    console.log('\n📦 PLANS:');
    try {
      const plans = await prisma.plan.findMany({
        take: 3
      });
      
      for (const plan of plans) {
        console.log(`   🎯 ${plan.name} - ${plan.price} ${plan.currency}`);
        console.log(`   🆔 ID: ${plan.id}`);
        console.log(`   ─────────────────────────`);
      }
    } catch (error) {
      console.log('❌ Eroare query plans:', error.message);
    }

  } catch (error) {
    console.error('💥 Eroare generală:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Rulează inspecția
inspectData(); 