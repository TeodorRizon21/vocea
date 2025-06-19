import 'dotenv/config';

import { prisma } from '../lib/prisma';
import { NetopiaV2, formatBillingInfo } from '../lib/netopia-v2';

/**
 * Script de iniţiere manuală a unei plăţi recurente folosind un token salvat
 *
 * Cum se rulează (exemple):
 *   npx ts-node scripts/manual-recurring.ts SUB_1750320099095 99.00
 *   node dist/scripts/manual-recurring.js SUB_1750320099095 79.50
 *
 * Parametri:
 *   argv[2] – ID-ul comenzii sursă (SUB_… din care se ia tokenul)
 *   argv[3] – (opţional) suma care trebuie percepută (RON). Dacă lipseşte, se foloseşte amount-ul din comanda sursă.
 */

(async () => {
  try {
    const [,, sourceOrderId, amountArg] = process.argv;

    if (!sourceOrderId) {
      console.error('❌ Trebuie să specifici ID-ul comenzii sursă (ex.: SUB_1750320099095)');
      process.exit(1);
    }

    const sourceOrder = await prisma.order.findUnique({
      where: { id: sourceOrderId }
    });

    if (!sourceOrder) {
      console.error(`❌ Comanda ${sourceOrderId} nu a fost găsită în baza de date`);
      process.exit(1);
    }

    if (!sourceOrder.token) {
      console.error(`❌ Comanda ${sourceOrderId} nu conţine un token salvat – nu se poate iniţia plata recurentă`);
      process.exit(1);
    }

    const amount = amountArg ? Number(amountArg) : Number(sourceOrder.amount);
    if (isNaN(amount) || amount <= 0) {
      console.error('❌ Suma trebuie să fie un număr pozitiv');
      process.exit(1);
    }

    // Construim datele de billing din comanda sursă
    const billingInfo = formatBillingInfo({
      firstName: sourceOrder.billingFirstName || 'Prenume',
      lastName: sourceOrder.billingLastName || 'Nume',
      email: sourceOrder.billingEmail || 'client@example.com',
      phone: sourceOrder.billingPhone || '0700000000',
      address: sourceOrder.billingAddress || 'Str. Exemplu nr. 1',
      city: sourceOrder.billingCity || 'Bucureşti',
      postalCode: sourceOrder.billingPostalCode || '010000'
    });

    const netopia = new NetopiaV2({
      apiKey: process.env.NETOPIA_API_KEY!,
      posSignature: process.env.NETOPIA_POS_SIGNATURE!,
      isProduction: process.env.NODE_ENV === 'production'
    });

    const newOrderId = `MANUAL_${Date.now()}`;
    const notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/netopia/ipn`;

    console.log('ℹ️  Pornesc plata recurentă…');
    console.table({
      sourceOrderId,
      newOrderId,
      amount,
      tokenPreview: sourceOrder.token.substring(0, 10) + '***'
    });

    const result = await netopia.createRecurringPayment({
      orderID: newOrderId,
      amount,
      currency: sourceOrder.currency || 'RON',
      description: `Plată recurentă manuală – sursă ${sourceOrderId}`,
      token: sourceOrder.token,
      billing: billingInfo,
      notifyUrl
    });

    console.log('\n✅ Răspuns NETOPIA:', result);
  } catch (err) {
    console.error('❌ Eroare în scriptul de plată recurentă:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})(); 