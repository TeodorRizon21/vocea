# 🧪 Testarea Plăților Recurente cu Sandbox Netopia Real

## 📋 Prezentare Generală

Acest ghid te va ajuta să testezi funcționalitatea de plăți recurente folosind token-uri reale din sandbox-ul Netopia.

## ✅ Am găsit token-uri reale în baza de date!

Conform ultimei verificări:
- **Comandă**: `TEST_REC_1749659273155_281p5slqr`
- **Sumă**: 8 RON
- **Status**: COMPLETED
- **Token**: `NETOPIA_TOKEN_174965...` (real Netopia token)
- **Utilizator**: test-recurring@example.com

## 🎯 Pași pentru Testarea Recurentei

### 1. Verificare Token-uri Existente

```bash
npm run test-real-tokens
```

### 2. Testare Manuală prin Browser

#### A. Accesează endpoint-ul de test:
```
http://localhost:3000/api/payment/test-recurring
```

#### B. Testează setup recurent:
```bash
curl -X POST http://localhost:3000/api/payment/setup-recurring \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST_REC_1749659273155_281p5slqr",
    "amount": 8,
    "currency": "RON"
  }'
```

#### C. Declanșează cron job manual:
```bash
curl -X POST http://localhost:3000/api/cron/recurring-payments
```

### 3. Crearea unei Plăți Noi în Sandbox

Pentru a obține token-uri fresh de la Netopia:

#### Pasul 1: Fă o plată nouă
1. Accesează aplicația: `http://localhost:3000`
2. Selectează un plan (ex: Premium - 8 RON)
3. Completează datele pentru plată

#### Pasul 2: Finalizează în Sandbox Netopia
1. Folosește datele de test Netopia:
   - **Card**: `4111111111111111`
   - **CVV**: `123`
   - **Data**: orice dată viitoare
   - **Nume**: orice nume

2. Completează plata cu succes

#### Pasul 3: Verifică salvarea token-ului
Token-ul se salvează automat prin callback IPN. Verifică în baza de date:

```bash
npm run test-real-tokens
```

### 4. Testarea Automată a Recurentei

Odată ce ai un token valid, poți testa:

#### A. Prin cron job:
```bash
curl -X POST http://localhost:3000/api/cron/recurring-payments
```

#### B. Prin endpoint dedicat:
```bash
curl -X POST http://localhost:3000/api/payment/setup-recurring \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID_CU_TOKEN",
    "amount": 8,
    "currency": "RON"
  }'
```

## 📊 Verificarea Rezultatelor

### 1. Check baza de date pentru plăți noi:
```sql
SELECT * FROM Order WHERE isRecurring = true ORDER BY createdAt DESC;
```

### 2. Verifică log-urile aplicației pentru:
- Procesarea token-urilor
- Rezultatele API Netopia
- Salvarea plăților recurente

### 3. Check-uri în Netopia Dashboard:
- Accesează contul de sandbox Netopia
- Verifică tranzacțiile recurente
- Monitorizează status-ul plăților

## 🚨 Troubleshooting

### Token Invalid/Expirat
```
💡 Soluție: Fă o plată nouă în sandbox pentru token fresh
```

### Erori de Autentificare
```
💡 Verifică API key-urile Netopia în .env
```

### Plăți Eșuate
```
💡 Check sandbox-ul Netopia pentru detalii despre erori
```

## 🎉 Rezultate Așteptate

Când testarea funcționează corect, vei vedea:

### ✅ În aplicație:
- Noi intrări în tabela `Order` cu `isRecurring: true`
- Token-uri păstrate pentru viitoare utilizări
- Status-uri actualizate pentru plăți

### ✅ În Netopia:
- Tranzacții recurente procesate
- Token-uri utilizate cu succes
- Confirmări de plată

### ✅ În log-uri:
```
✅ Plată recurentă creată cu succes!
💳 Payment ID: NETOPIA_PAYMENT_ID
📊 Status: confirmed
💰 Sumă: 8 RON
```

## 📝 Note Importante

1. **Token-urile Netopia sunt valabile pentru o perioadă limitată**
2. **Sandbox-ul Netopia poate avea limitări de frecvență**
3. **Testează întotdeauna cu sume mici**
4. **Verifică că IPN callback-ul funcționează corect**

## 🔄 Automatizare Completă

Pentru automatizare completă, setează un cron job real care să ruleze:
```bash
0 0 * * * curl -X POST http://your-domain.com/api/cron/recurring-payments
```

Acest job va procesa automat toate plățile recurente cu token-uri valide! 