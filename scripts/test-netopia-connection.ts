import { config } from 'dotenv';
import { NetopiaV2, formatBillingInfo } from '../lib/netopia-v2';

// Încarcă variabilele de mediu
config();

async function testNetopiaConnection() {
  try {
    console.log('\n=== Test Conexiune Netopia V2 ===\n');

    // Verifică prezența variabilelor de mediu
    console.log('Verificare variabile de mediu:');
    const apiKey = process.env.NETOPIA_API_KEY;
    const posSignature = process.env.NETOPIA_POS_SIGNATURE;
    
    if (!apiKey || !posSignature) {
      throw new Error('Lipsesc variabilele de mediu NETOPIA_API_KEY sau NETOPIA_POS_SIGNATURE');
    }

    console.log('✓ NETOPIA_API_KEY găsit (primele 5 caractere):', apiKey.substring(0, 5) + '...');
    console.log('✓ NETOPIA_POS_SIGNATURE găsit (primele 5 caractere):', posSignature.substring(0, 5) + '...');

    // Inițializează clientul Netopia
    console.log('\nInițializare client Netopia V2...');
    const netopia = new NetopiaV2({
      apiKey,
      posSignature,
      isProduction: false // Folosim sandbox pentru teste
    });

    // Pregătește informațiile de facturare
    const billingInfo = formatBillingInfo({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '0700000000',
      address: 'Test Address',
      city: 'Bucharest',
      postalCode: '010000'
    });

    // Creează o plată de test
    console.log('\nÎncercare creare plată de test...');
    const testPayment = await netopia.createHostedPayment({
      orderID: `TEST_CONNECTION_${Date.now()}`,
      amount: 1, // 1 RON pentru test
      currency: 'RON',
      description: 'Test conexiune Netopia V2',
      billing: billingInfo,
      notifyUrl: 'http://localhost:3000/api/netopia/ipn',
      redirectUrl: 'http://localhost:3000/api/netopia/return',
      language: 'ro'
    });

    if (testPayment.redirectUrl) {
      console.log('\n✅ Conexiune reușită!');
      console.log('📊 Detalii răspuns:');
      console.log('   🔗 Redirect URL:', testPayment.redirectUrl ? 'Prezent' : 'Absent');
      console.log('   📝 Form Data:', testPayment.formData ? 'Prezent' : 'Absent');
      console.log('   🆔 NTP ID:', testPayment.ntpID || 'N/A');
      console.log('   🔐 3DS Required:', testPayment.requires3DS ? 'Da' : 'Nu');
      
      if (testPayment.redirectUrl) {
        console.log('\n🔗 URL pentru testare:', testPayment.redirectUrl);
        console.log('💡 Poți accesa acest URL într-un browser pentru a testa plata completă');
      }
    } else {
      throw new Error(`Eroare la crearea plății: ${testPayment.error || 'Eroare necunoscută'}`);
    }

    // Test recurenta cu token mock (doar pentru testarea API-ului)
    console.log('\n🔄 Test API recurenta cu token mock...');
    try {
      const recurringTest = await netopia.createRecurringPayment({
        orderID: `TEST_RECURRING_${Date.now()}`,
        amount: 1,
        currency: 'RON',
        description: 'Test plată recurentă',
        token: 'MOCK_TOKEN_FOR_API_TEST',
        billing: billingInfo,
        notifyUrl: 'http://localhost:3000/api/netopia/ipn'
      });
      
      console.log('✅ API recurenta răspunde (chiar dacă token-ul este invalid)');
    } catch (recurringError) {
      console.log('⚠️  API recurenta răspunde cu eroare (normal pentru token mock)');
    }

  } catch (error) {
    console.error('\n❌ Test eșuat:', error instanceof Error ? error.message : 'Eroare necunoscută');
    console.error('\nDetalii complete error:', error);
    process.exit(1);
  }
}

// Rulează testul
testNetopiaConnection(); 