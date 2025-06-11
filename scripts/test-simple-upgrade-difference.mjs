import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Plan hierarchy and prices (same as in payment API)
const PLAN_HIERARCHY = {
  Bronze: 1,
  Basic: 2,
  Premium: 3,
  Gold: 4
};

const PLAN_PRICES = {
  Bronze: 3.8,
  Basic: 0,
  Premium: 8,
  Gold: 28
};

async function testSimpleUpgrade() {
  try {
    console.log('💰 TESTEZ SISTEMUL SIMPLU DE UPGRADE (DOAR DIFERENȚA)!\n');

    // Scenarii simple de upgrade
    const scenarios = [
      {
        name: "Premium → Gold (exemplul tău)",
        currentPlan: "Premium",
        newPlan: "Gold"
      },
      {
        name: "Bronze → Premium",
        currentPlan: "Bronze", 
        newPlan: "Premium"
      },
      {
        name: "Bronze → Gold",
        currentPlan: "Bronze",
        newPlan: "Gold"
      },
      {
        name: "Basic → Premium",
        currentPlan: "Basic",
        newPlan: "Premium"
      },
      {
        name: "Basic → Gold",
        currentPlan: "Basic",
        newPlan: "Gold"
      }
    ];

    scenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. 📊 ${scenario.name}`);
      
      const currentPlanPrice = PLAN_PRICES[scenario.currentPlan];
      const newPlanPrice = PLAN_PRICES[scenario.newPlan];
      const priceDifference = newPlanPrice - currentPlanPrice;
      
      console.log(`   💰 Preț ${scenario.currentPlan}: ${currentPlanPrice} RON`);
      console.log(`   💰 Preț ${scenario.newPlan}: ${newPlanPrice} RON`);
      console.log(`   ✅ PLĂTEȘTI DOAR: ${priceDifference} RON (diferența)`);
      console.log(`   💸 Economie față de prețul complet: ${(newPlanPrice - priceDifference).toFixed(2)} RON`);
      console.log('');
    });

    // Test cu abonament real din baza de date
    console.log('🔍 TESTEZ CU ABONAMENT REAL DIN BAZA DE DATE:\n');
    
    const userEmail = 'rizon.teodor@gmail.com';
    const user = await prisma.user.findFirst({
      where: { email: userEmail }
    });

    if (user) {
      const currentSubscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: {
            in: ['active', 'cancelled']
          },
          endDate: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (currentSubscription) {
        console.log('✅ Abonament activ găsit:');
        console.log(`   👤 User: ${user.email}`);
        console.log(`   📋 Plan curent: ${currentSubscription.plan}`);
        console.log(`   📅 Data expirare: ${currentSubscription.endDate.toLocaleDateString('ro-RO')}`);
        
        // Testează upgrade la toate planurile superioare
        const currentPlan = currentSubscription.plan;
        const availableUpgrades = Object.keys(PLAN_HIERARCHY).filter(plan => 
          PLAN_HIERARCHY[plan] > PLAN_HIERARCHY[currentPlan]
        );

        if (availableUpgrades.length > 0) {
          console.log(`\n🚀 Upgrade-uri disponibile din ${currentPlan}:`);
          
          availableUpgrades.forEach(newPlan => {
            const currentPrice = PLAN_PRICES[currentPlan];
            const newPrice = PLAN_PRICES[newPlan];
            const difference = newPrice - currentPrice;
            
            console.log(`   📈 ${currentPlan} → ${newPlan}: plătești ${difference} RON (în loc de ${newPrice} RON)`);
          });
        } else {
          console.log(`\n🏆 Ai deja cel mai înalt plan: ${currentPlan}!`);
        }
      } else {
        console.log('❌ Nu există abonament activ pentru acest user');
        console.log('💡 Pentru primul abonament se plătește prețul complet');
      }
    } else {
      console.log('❌ User-ul nu a fost găsit');
    }

    console.log('\n🎯 CONCLUZIE:');
    console.log('✅ Sistem simplu și clar!');
    console.log('✅ Premium → Gold = plătești 20 RON (28 - 8)');
    console.log('✅ Bronze → Premium = plătești 4.2 RON (8 - 3.8)');
    console.log('✅ Nu contează când expire abonamentul');
    console.log('✅ Pur și simplu diferența de preț!');

  } catch (error) {
    console.error('❌ Eroare la testarea upgrade-ului simplu:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleUpgrade(); 