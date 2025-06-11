# 🥉 Testarea Recurentei pe Plăți Bronze Reale

## 📊 Situația Actuală

### ✅ Ce avem:
- **3 plăți Bronze completate** (3.8 RON) pentru `rizon.teodor@gmail.com`
- **CRON_SECRET configurat** pentru expirarea proiectelor la 30 zile
- **Sistemul de plăți recurente implementat**

### ❌ Problemele identificate:
1. **TOATE plățile Bronze sunt fără token-uri Netopia**
2. **Cron endpoint returnează 404** (problemă de configurare Next.js)
3. **IPN callback-ul nu salvează token-urile** în plățile reale

## 🎯 Pașii pentru Testare

### Pasul 1: Obține Token-uri Reale din Sandbox Netopia

Pentru a testa recurenta pe planul Bronze, trebuie să obții token-uri Netopia:

#### A. Fă o plată nouă Bronze în aplicație:
```bash
1. Accesează http://localhost:3000
2. Loghează-te cu rizon.teodor@gmail.com
3. Selectează planul Bronze (3.8 RON)
4. Completează procesul de plată
```

#### B. În sandbox Netopia folosește:
```
Card: 4111111111111111
CVV: 123
Data: 12/25 (orice dată viitoare)
Nume: Test User
```

#### C. Verifică că token-ul se salvează:
```bash
npm run test-real-tokens
```

### Pasul 2: Testare Manuală a Recurentei

#### A. Test prin cron job cu autentificare:
```bash
npm run test-bronze-cron
```

#### B. Test direct cu token (dacă ai primit token):
```javascript
// Prin console browser pe http://localhost:3000
fetch('/api/payment/setup-recurring', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'SUB_1749653954888', // Una din plățile Bronze
    amount: 3.8,
    currency: 'RON'
  })
}).then(r => r.json()).then(console.log)
```

### Pasul 3: Repară Cron Job-ul (404 Error)

Problema 404 se poate datora:

#### A. Restart server Next.js:
```bash
# Oprește serverul (Ctrl+C)
# Apoi repornește:
npm run dev
```

#### B. Verifică structure folderelor:
```bash
app/api/cron/recurring-payments/route.ts  # Trebuie să existe
```

#### C. Test cron cu autentificare corectă:
```bash
# Cu header-ul corect:
curl -X POST http://localhost:3000/api/cron/recurring-payments \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Pasul 4: Debug IPN Callback

Pentru a înțelege de ce token-urile nu se salvează:

#### A. Verifică log-urile în timp real:
```bash
# În terminal separat, urmărește log-urile aplicației
```

#### B. Testează IPN callback manual:
```bash
# Simulează un callback Netopia cu token
curl -X POST http://localhost:3000/api/netopia/ipn \
  -H "Content-Type: application/json" \
  -d '{
    "payment": {
      "id": "TEST_PAYMENT_ID",
      "orderID": "SUB_1749653954888",
      "status": "confirmed",
      "amount": 3.8,
      "tokenData": {
        "token": "TEST_NETOPIA_TOKEN_FOR_BRONZE"
      }
    }
  }'
```

## 🚀 Soluția Rapidă - Mock Token pentru Test

Pentru testare imediată, să adaugi un token mock la una din plățile Bronze:

### Script SQL în Prisma Studio:
```sql
UPDATE Order 
SET token = 'MOCK_NETOPIA_TOKEN_FOR_TESTING_12345'
WHERE orderId = 'SUB_1749653954888';
```

### Sau prin script:
```bash
# Creează un script rapid pentru a adăuga token mock
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  await prisma.order.update({
    where: { orderId: 'SUB_1749653954888' },
    data: { token: 'MOCK_NETOPIA_TOKEN_FOR_TESTING_12345' }
  });
  console.log('Token mock adăugat!');
  await prisma.$disconnect();
})();
"
```

Apoi testează:
```bash
npm run test-bronze-cron
```

## 📋 Checklist de Testare

### ✅ Pre-requisites:
- [ ] Serverul rulează pe localhost:3000
- [ ] CRON_SECRET este setat în env
- [ ] Cel puțin o plată Bronze completată există

### ✅ Tests de execut:
- [ ] Test token-uri existente: `npm run test-real-tokens`
- [ ] Test cron cu autentificare: `npm run test-bronze-cron`
- [ ] Plată nouă în sandbox pentru token real
- [ ] Verificare salvare token în IPN
- [ ] Test final recurenta cu token real

### ✅ Rezultate așteptate:
- [ ] Cron job se execută fără erori 404/401
- [ ] Plățile cu token-uri generează plăți recurente noi
- [ ] Token-urile se păstrează pentru utilizări viitoare
- [ ] Plățile eșuate se marchează corespunzător

## 🎉 Rezultatul Final

Când totul funcționează, vei vedea:

```bash
🧪 Testez plata recurentă cu token pentru: SUB_1749653954888
✅ Testarea prin API a fost realizată cu succes!
🎉 PLATA RECURENTĂ A FOST PROCESATĂ CU SUCCES!
💳 Payment ID: NETOPIA_RECURRING_PAYMENT_ID
📊 Status: confirmed
```

Și în baza de date:
- Noi intrări în `Order` cu `isRecurring: true`
- Status `COMPLETED` pentru plățile procesate cu succes
- Token-uri păstrate pentru viitoare utilizări recurente

## 🔄 Automatizare Completă

Pentru a rula automat la fiecare 30 de zile (sau orice interval):

```bash
# În producție, configurează un cron job real:
0 0 1 * * curl -X POST https://your-domain.com/api/cron/recurring-payments \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Acesta va procesa automat toate plățile recurente cu token-uri valide! 