import { config } from 'dotenv';

// Încarcă variabilele de mediu
config();

async function testCronWithSecret() {
  try {
    console.log('🔐 Testez cron job-ul cu CRON_SECRET...');
    
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.log('❌ CRON_SECRET nu este setat în variabilele de mediu');
      console.log('💡 Verifică dacă .env.local sau .env conține CRON_SECRET');
      return;
    }
    
    console.log(`✅ CRON_SECRET găsit: ${cronSecret.substring(0, 10)}...`);
    
    const response = await fetch('http://localhost:3000/api/cron/recurring-payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status răspuns: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cron job executat cu succes!');
      console.log('📋 Rezultate:');
      console.log(`   📦 Procesate: ${result.processed || 0}`);
      console.log(`   ✅ Succes: ${result.successful || 0}`);
      console.log(`   ❌ Eșecuri: ${result.failed || 0}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('🚨 Erori:');
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      if (result.processed === 0) {
        console.log('');
        console.log('💡 Nu s-au găsit comenzi de procesat. Motivele posibile:');
        console.log('   - Toate comenzile recurente sunt mai noi de 30 de zile');
        console.log('   - Nu există comenzi cu token-uri valide');
        console.log('   - Comenzile au eșuat deja de 3 ori');
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Eroare cron job:', errorText);
      
      if (response.status === 401) {
        console.log('🔐 Problemă de autentificare - verifică CRON_SECRET');
      }
    }

  } catch (error) {
    console.error('❌ Eroare la testarea cron job-ului:', error.message);
  }
}

async function testBronzePayments() {
  console.log('\n🥉 Analizez plățile Bronze...');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Găsește plățile Bronze completate
    const bronzePayments = await prisma.order.findMany({
      where: {
        subscriptionType: 'Bronze',
        status: 'COMPLETED',
        amount: 3.8 // Confirmă că sunt pentru planul Bronze
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
      },
      take: 5 // Doar ultimele 5
    });
    
    console.log(`📊 Găsite ${bronzePayments.length} plăți Bronze completate:`);
    
    bronzePayments.forEach((payment, index) => {
      console.log(`\n${index + 1}. ${payment.orderId}`);
      console.log(`   👤 User: ${payment.user?.email}`);
      console.log(`   🗓️  Data: ${payment.createdAt.toLocaleDateString('ro-RO')}`);
      console.log(`   🔑 Token: ${payment.token ? 'DA' : 'NU'}`);
      console.log(`   🔄 Recurent: ${payment.isRecurring ? 'DA' : 'NU'}`);
    });
    
    if (bronzePayments.length > 0) {
      const withTokens = bronzePayments.filter(p => p.token && !p.token.startsWith('TEST_'));
      const withoutTokens = bronzePayments.filter(p => !p.token || p.token.startsWith('TEST_'));
      
      console.log(`\n📈 Statistici: ${withTokens.length} cu token-uri, ${withoutTokens.length} fără token-uri`);
      
      if (withoutTokens.length > 0) {
        console.log('\n❗ PROBLEMĂ: Plățile Bronze nu au token-uri salvate!');
        console.log('💡 Soluții:');
        console.log('1. Verifică dacă IPN callback-ul funcționează corect');
        console.log('2. Testează o plată nouă în sandbox Netopia');
        console.log('3. Verifică că token-urile sunt salvate în callback');
      }
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Eroare la analiza plăților Bronze:', error.message);
  }
}

// Rulează testele
console.log('🧪 TESTARE RECURENTĂ CU PLĂȚI BRONZE REALE\n');
await testCronWithSecret();
await testBronzePayments();

console.log('\n📋 CONCLUZIE:');
console.log('Pentru a testa recurenta cu plăți Bronze reale:');
console.log('1. ✅ Cron job-ul funcționează (dacă nu sunt erori de autentificare)');
console.log('2. ❗ Plățile Bronze au nevoie de token-uri Netopia');
console.log('3. 🔧 Fă o plată nouă în sandbox pentru a obține token-uri');
console.log('4. 🔄 Apoi testează din nou cron job-ul'); 