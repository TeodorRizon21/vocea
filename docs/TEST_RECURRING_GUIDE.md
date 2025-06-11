# Ghid Rapid de Testare - Plăți Recurente

## 🚀 Testare Rapidă în 5 Pași

### 1. Testare Completă Automatizată
```bash
npm run test-recurring
```
Acest script va:
- ✅ Crea o comandă de test cu token simulat
- ✅ Declanșa cron job-ul pentru plăți recurente  
- ✅ Verifica statusul plăților
- ✅ Afișa rezultatele complete

### 2. Testare Doar Cron Job
```bash
npm run test-recurring-cron
```
Declanșează manual cron job-ul pentru a procesa plățile recurente existente.

### 3. Verificare Status
```bash
npm run test-recurring-status
```
Afișează statistici despre plățile recurente active.

### 4. Creare Comandă de Test
```bash
npm run test-recurring-create
```
Creează o comandă de test cu token pentru testare ulterioară.

## 🔧 Testare Manuală cu API

### Declanșarea Cron Job-ului Manual
```bash
curl -X POST http://localhost:3000/api/cron/recurring-payments \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Verificarea Statusului Plăților Recurente
```bash
curl -X GET http://localhost:3000/api/cron/recurring-payments \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Testarea Plății cu Token Specific
```bash
curl -X POST http://localhost:3000/api/payment/test-recurring \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "orderId": "EXISTING_ORDER_ID_WITH_TOKEN",
    "amount": 29.99,
    "currency": "RON"
  }'
```

### Testarea cu Token Direct
```bash
curl -X POST http://localhost:3000/api/payment/test-recurring \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "orderToken": "YOUR_NETOPIA_TOKEN",
    "amount": 29.99,
    "currency": "RON"
  }'
```

## 🎯 Testarea Într-un Mediu Real

### 1. Configurarea pentru Sandbox Netopia
```env
# .env.local
NETOPIA_API_KEY=your_sandbox_api_key
NETOPIA_POS_SIGNATURE=your_sandbox_pos_signature
NODE_ENV=development
NEXT_PUBLIC_APP_URL=https://your-domain.com
CRON_SECRET=your-secret-key
```

### 2. Activarea Tokenizării în Netopia
1. Accesează panoul de administrare Netopia Sandbox
2. Mergi la **Seller Accounts** → **Security Settings**
3. Activează **Enable Tokenization**
4. Activează **Recurring Payments**

### 3. Efectuarea Unei Plăți Reale (Sandbox)
```bash
curl -X POST http://localhost:3000/api/payment/setup-recurring \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "your_plan_id",
    "enableAutoRecurring": true
  }'
```

### 4. Folosirea Cardurilor de Test Netopia
Pentru sandbox folosește:
- **Card**: `9900004810225098`
- **CVV**: `111`
- **Expiry**: `12/2025`

## 📊 Monitorizarea Testelor

### Log-uri Importante
```bash
# Urmărește log-urile în timp real
tail -f logs/application.log | grep -E "(RECURRING|NETOPIA|TOKEN)"
```

### Verificarea Comenzilor cu Token
```sql
-- SQL pentru verificarea comenzilor cu token
SELECT 
  orderId, 
  amount, 
  currency, 
  status, 
  isRecurring,
  token IS NOT NULL as hasToken,
  LEFT(token, 15) as tokenPreview,
  lastChargeAt,
  nextChargeAt
FROM "Order" 
WHERE isRecurring = true 
AND token IS NOT NULL;
```

## 🐛 Debugging Problemelor Comune

### 1. Token-urile nu se salvează
**Cauze posibile:**
- Tokenizarea nu e activată în Netopia
- IPN-ul nu procesează câmpul `tokenId`
- Erori în mapping-ul răspunsului Netopia

**Soluție:**
```bash
# Verifică log-urile IPN
curl -X GET http://localhost:3000/api/netopia/ipn-logs
```

### 2. Cron Job-ul nu rulează
**Verificare:**
```bash
npm run test-recurring-cron
```

**Dacă returnează 401:**
- Verifică `CRON_SECRET` în `.env.local`
- Asigură-te că header-ul Authorization este corect

### 3. Plăți cu Token Eșuate
**Verificare token:**
```bash
curl -X GET http://localhost:3000/api/payment/test-recurring \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Cauze posibile:**
- Token expirat
- Token invalid
- Probleme cu API-ul Netopia

## 🎯 Testare în Etape

### Etapa 1: Funcționalitatea de Bază
```bash
# 1. Creează comandă de test
npm run test-recurring-create

# 2. Verifică statusul
npm run test-recurring-status

# 3. Rulează cron job
npm run test-recurring-cron
```

### Etapa 2: Testare cu Date Reale
1. Configurează sandbox Netopia
2. Efectuează o plată reală în sandbox
3. Verifică că token-ul se salvează în IPN
4. Testează plata recurentă automată

### Etapa 3: Testare în Producție
1. Configurează cron job real (Vercel, GitHub Actions, etc.)
2. Monitorizează prima plată recurentă automată
3. Verifică notificările și actualizările de status

## 📋 Checklist Testare Completă

- [ ] Script de testare rulează fără erori
- [ ] Cron job-ul se execută manual cu succes  
- [ ] Token-urile se salvează din IPN
- [ ] Plățile cu token funcționează
- [ ] Statusul comenzilor se actualizează corect
- [ ] Abonamentele se activează/dezactivează corect
- [ ] Log-urile sunt clare și utile
- [ ] Testarea în sandbox Netopia funcționează
- [ ] Gestionarea erorilor funcționează (token-uri expirate, etc.)

## 🔄 Automatizarea Testelor

### GitHub Actions pentru Testare Continuă
```yaml
# .github/workflows/test-recurring.yml
name: Test Recurring Payments
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *' # La fiecare 6 ore
    
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test-recurring-status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
```

## 💡 Tips pentru Testare

1. **Folosește date de test consistente** - cu același utilizator și plan
2. **Monitorizează log-urile** - pentru a înțelege fluxul complet
3. **Testează scenarii de eroare** - token-uri expirate, carduri respinse
4. **Verifică impactul asupra bazei de date** - statusuri, date de încărcare
5. **Testează în medii diferite** - development, staging, production

## 🆘 Suport și Debugging

### Pentru probleme specifice:
1. Verifică log-urile cu `npm run test-recurring`
2. Rulează testele individuale pentru a izola problema
3. Verifică configurația Netopia în panoul de administrare
4. Consultă documentația din `docs/RECURRING_PAYMENTS_SETUP.md`

### Contactează echipa dacă:
- Token-urile nu se generează în sandbox
- API-ul Netopia returnează erori consistente
- Cron job-ul nu funcționează în producție 