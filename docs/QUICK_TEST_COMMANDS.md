# Comenzi Rapide pentru Testarea Plăților Recurente

## 🚀 Comenzi de Testare Instantanee

### 1. Pornește aplicația
```bash
npm run dev
```

### 2. În alt terminal - testează plățile recurente
```bash
# Testare completă automatizată
npm run test-recurring

# Sau teste individuale:
npm run test-recurring-create    # Creează comandă de test
npm run test-recurring-cron      # Declanșează cron job manual
npm run test-recurring-status    # Verifică statusul
```

## 🎯 Testare cu Aplicația Rulând

### Verifică statusul plăților recurente:
```bash
curl -X GET http://localhost:3000/api/cron/recurring-payments \
  -H "Authorization: Bearer your-cron-secret"
```

### Declanșează manual procesarea:
```bash
curl -X POST http://localhost:3000/api/cron/recurring-payments \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

### Testează plată cu token (dacă ai unul):
```bash
curl -X POST http://localhost:3000/api/payment/test-recurring \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "orderToken": "YOUR_TOKEN_HERE",
    "amount": 29.99
  }'
```

## 🔧 Simulare Rapidă de Plată Recurentă

### Folosind scriptul de test:
```bash
# 1. Creează comandă cu token simulat
npm run test-recurring-create

# 2. Declanșează procesarea
npm run test-recurring-cron

# 3. Verifică rezultatele
npm run test-recurring-status
```

## 📊 Verificare în Baza de Date

### Verifică comenzile cu token-uri:
```sql
SELECT 
  orderId, 
  amount, 
  status, 
  isRecurring,
  token IS NOT NULL as hasToken,
  createdAt
FROM "Order" 
WHERE isRecurring = true 
ORDER BY createdAt DESC 
LIMIT 5;
```

### Verifică abonamentele active:
```sql
SELECT 
  status, 
  plan, 
  amount, 
  startDate, 
  endDate
FROM "Subscription" 
WHERE status = 'active' 
ORDER BY createdAt DESC;
```

## ⚡ Test Rapid de 30 Secunde

```bash
# 1. Pornește aplicația (într-un terminal)
npm run dev

# 2. În alt terminal - creează și testează
npm run test-recurring-create
npm run test-recurring-cron

# 3. Verifică log-urile aplicației pentru rezultate
```

## 🌐 Testare cu Date Reale Netopia

### Pentru sandbox Netopia:
1. Configurează variabilele de mediu:
```env
NETOPIA_API_KEY=your_sandbox_key
NETOPIA_POS_SIGNATURE=your_sandbox_signature
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=test-secret-123
```

2. Testează conectivitatea:
```bash
curl -X POST http://localhost:3000/api/payment/setup-recurring \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "your_plan_id",
    "enableAutoRecurring": true
  }'
```

## 🚨 Debugging Rapid

### Verifică log-urile pentru erori:
```bash
# În consolă - urmărește log-urile aplicației Next.js
# Caută pentru: [RECURRING], [NETOPIA], [TOKEN]
```

### Testează individual componentele:
```bash
# 1. Testează doar crearea comenzii
npm run test-recurring-create

# 2. Testează doar cron job-ul
npm run test-recurring-cron

# 3. Verifică statusul final
npm run test-recurring-status
```

## ✅ Ce Să Urmărești în Teste

1. **Logs cu "[RECURRING_CRON]"** - procesarea comenzilor
2. **Logs cu "[NETOPIA_V2]"** - comunicarea cu API-ul Netopia  
3. **Status code 200** în răspunsurile API
4. **Token-uri salvate** în baza de date
5. **Comenzi noi create** pentru plăți recurente

## 🔄 Curățarea După Teste

```bash
# Șterge datele de test
npm run test-recurring-cleanup

# Sau manual în baza de date:
# DELETE FROM "Order" WHERE orderId LIKE 'TEST_%';
```

## 📋 Checklist Test Rapid

- [ ] Aplicația rulează pe `localhost:3000`
- [ ] Variabilele de mediu sunt configurate
- [ ] `npm run test-recurring-create` creează comenzi
- [ ] `npm run test-recurring-cron` procesează comenzi
- [ ] Log-urile afișează activitate de procesare
- [ ] Nu apar erori în consolă

## 💡 Pro Tips

1. **Rulează testele cu aplicația pornită** pentru rezultate complete
2. **Urmărește log-urile în timp real** pentru debugging
3. **Testează în sandbox Netopia** pentru validare reală
4. **Verifică baza de date** pentru a confirma modificările
5. **Folosește Postman/curl** pentru testare manuală de API-uri 