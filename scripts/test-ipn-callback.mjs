import { config } from 'dotenv';

config();

async function testIpnCallback() {
  try {
    console.log('🧪 TESTEZ IPN CALLBACK PENTRU SALVAREA TOKEN-URILOR!\n');

    // Simulez date reale de la Netopia pentru o plată recentă
    const mockNetopiaData = {
      ntpID: 'NTP_TEST_' + Date.now(),
      orderID: 'SUB_1749660885981', // Plata ta nouă
      amount: 8,
      currency: 'RON',
      status: 5, // Confirmed
      paymentMethod: 'card',
      maskedCard: '****-****-****-1234',
      rrn: 'TEST123456789',
      authCode: 'TEST123',
      errorCode: 0,
      tokenId: `NETOPIA_TOKEN_${Date.now()}_REAL`, // Simulez token real de la Netopia
      tokenExpirationDate: '2025-12-31'
    };

    console.log('📤 Trimit date IPN simulate către callback:', {
      orderID: mockNetopiaData.orderID,
      status: mockNetopiaData.status,
      amount: mockNetopiaData.amount,
      tokenId: mockNetopiaData.tokenId.substring(0, 25) + '...'
    });

    // Trimit request la IPN endpoint-ul local
    const response = await fetch('http://localhost:3000/api/netopia/ipn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NETOPIA-Payments/2.0'
      },
      body: JSON.stringify(mockNetopiaData)
    });

    console.log('\n📨 Răspuns de la IPN callback:');
    console.log('   📊 Status Code:', response.status);
    console.log('   📋 Status Text:', response.statusText);

    const responseData = await response.json();
    console.log('   📄 Response Body:', responseData);

    if (response.ok && responseData.errorCode === 0) {
      console.log('\n🎉 IPN CALLBACK REUȘIT!');
      
      // Verifică dacă token-ul a fost salvat
      console.log('\n🔍 Verifică dacă token-ul a fost salvat în baza de date...');
      
      // Importă Prisma pentru verificare
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      try {
        const updatedOrder = await prisma.order.findUnique({
          where: { orderId: mockNetopiaData.orderID },
          select: {
            orderId: true,
            status: true,
            token: true,
            netopiaId: true
          }
        });

        if (updatedOrder) {
          console.log('✅ Order găsit în baza de date:');
          console.log(`   🆔 Order ID: ${updatedOrder.orderId}`);
          console.log(`   📊 Status: ${updatedOrder.status}`);
          console.log(`   🔑 Token: ${updatedOrder.token ? updatedOrder.token.substring(0, 25) + '...' : 'LIPSEȘTE'}`);
          console.log(`   🏷️  Netopia ID: ${updatedOrder.netopiaId || 'LIPSEȘTE'}`);

          if (updatedOrder.token) {
            console.log('\n🎯 SUCCESS! TOKEN-UL A FOST SALVAT!');
            console.log('✅ IPN callback-ul funcționează perfect pentru token-uri');
          } else {
            console.log('\n❌ TOKEN-UL NU A FOST SALVAT');
            console.log('🔧 Verifică logica de salvare în IPN callback');
          }
        } else {
          console.log('❌ Order-ul nu a fost găsit în baza de date');
        }
        
        await prisma.$disconnect();
      } catch (dbError) {
        console.log('❌ Eroare la verificarea bazei de date:', dbError.message);
      }

    } else {
      console.log('\n❌ IPN CALLBACK EȘUAT:');
      console.log('   🚨 Error Code:', responseData.errorCode);
      console.log('   💬 Message:', responseData.message);
    }

    // Test și cu alte variante de nume pentru token
    console.log('\n🧪 Testez cu variante alternative de nume pentru token...');
    
    const alternativeTokenData = {
      ...mockNetopiaData,
      orderID: 'SUB_1749653954888', // Alta plată Bronze
      tokenId: undefined, // Șterge tokenId
      token: `ALT_TOKEN_${Date.now()}`, // Folosește 'token' în loc de 'tokenId'
      ntpID: 'NTP_ALT_' + Date.now()
    };

    const altResponse = await fetch('http://localhost:3000/api/netopia/ipn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NETOPIA-Payments/2.0'
      },
      body: JSON.stringify(alternativeTokenData)
    });

    console.log('\n📨 Răspuns pentru token alternativ:');
    console.log('   📊 Status:', altResponse.status);
    const altResponseData = await altResponse.json();
    console.log('   📄 Body:', altResponseData);

  } catch (error) {
    console.error('❌ Eroare la testarea IPN callback:', error.message);
  }
}

testIpnCallback(); 