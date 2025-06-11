# Configurarea Plăților Automat Recurente cu Netopia

## Prezentare Generală

Sistemul suportă plăți automat recurente prin folosirea tokenizării Netopia. Acest lucru permite efectuarea plăților lunare fără intervenția utilizatorului, după configurarea inițială.

## Cum Funcționează

### 1. Prima Plată și Tokenizarea
- Utilizatorul efectuează prima plată normal prin interfața Netopia
- Netopia returnează un `token_id` în răspunsul IPN după plata cu succes
- Token-ul este salvat automat în câmpul `token` din tabela `Order`

### 2. Plăți Automate Ulterioare
- Cron job-ul rulează zilnic și verifică comenzile cu `isRecurring: true`
- Pentru comenzile cu token salvat, se folosește API-ul de plăți recurente Netopia
- Pentru comenzile fără token, se creează plăți normale (utilizatorul trebuie să reintroducă datele)

## Setarea Plăților Automat Recurente

### Endpoint: `/api/payment/setup-recurring`

```javascript
const response = await fetch('/api/payment/setup-recurring', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: 'plan_id_here',
    enableAutoRecurring: true // Default: true
  })
});

const data = await response.json();
if (data.success) {
  // Redirecționează utilizatorul către URL-ul de plată
  window.location.href = data.redirectUrl;
}
```

### Răspuns de Succes
```json
{
  "success": true,
  "redirectUrl": "https://secure.netopia-payments.com/...",
  "orderId": "SETUP_1234567890_abc123",
  "message": "Plata a fost inițiată. După completarea cu succes, viitoarele plăți vor fi automate."
}
```

## Configurarea Tokenizării în Netopia

### 1. Activarea în Panoul de Administrare
- Accesați panoul de administrare Netopia
- Navigați la **Seller Accounts** → **Security Settings**
- Activați opțiunea **Enable Tokenization**
- Asigurați-vă că **Recurring Payments** sunt activate

### 2. Configurarea Setărilor API
```env
# .env.local
NETOPIA_API_KEY=your_api_key_here
NETOPIA_POS_SIGNATURE=your_pos_signature_here
NETOPIA_TOKENIZATION_ENABLED=true
```

## Fluxul Complet de Tokenizare

### 1. Inițierea Plății cu Tokenizare
```javascript
// În lib/netopia-v2.ts - metoda createHostedPayment include automat tokenizarea
const paymentResult = await netopia.createHostedPayment({
  orderID: orderId,
  amount: plan.price,
  currency: plan.currency,
  description: "Configurare plată automată - Premium",
  billing: billingInfo,
  notifyUrl: `${baseUrl}/api/netopia/ipn`,
  redirectUrl: `${baseUrl}/payment/success`,
  language: 'ro'
});
```

### 2. Procesarea IPN cu Salvarea Token-ului
```javascript
// În app/api/netopia/ipn/route.ts
const updatedOrder = await prisma.order.update({
  where: { orderId: ipnData.orderID },
  data: { 
    status: orderStatus,
    // Token-ul este salvat automat din răspunsul IPN
    ...(ipnData.tokenId && {
      token: ipnData.tokenId
    }),
    ...(orderStatus === 'COMPLETED' && {
      paidAt: new Date(),
      // Setează următoarea dată de încărcare pentru plăți recurente
      ...(order.isRecurring && {
        lastChargeAt: new Date(),
        nextChargeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    })
  }
});
```

### 3. Plăți Automate cu Token
```javascript
// În cron job - app/api/cron/recurring-payments/route.ts
if (order.token) {
  // Plată complet automată
  paymentResult = await netopia.createRecurringPayment({
    orderID: newOrderId,
    amount: order.amount,
    currency: order.currency,
    description: `Abonament ${order.plan.name} - Plată recurentă automată`,
    token: order.token,
    billing: billingInfo,
    notifyUrl
  });
} else {
  // Fallback la plată normală
  console.log('No token found, user needs to enter card details again');
}
```

## Configurarea Cron Job-ului

### 1. Vercel Cron (Recomandat pentru producție)
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/recurring-payments",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### 2. Cron Manual (Pentru servere proprii)
```bash
# Adaugă în crontab
0 8 * * * curl -X POST https://your-domain.com/api/cron/recurring-payments \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 3. GitHub Actions (Pentru dezvoltare)
```yaml
# .github/workflows/recurring-payments.yml
name: Recurring Payments
on:
  schedule:
    - cron: '0 8 * * *'
jobs:
  run-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger recurring payments
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/recurring-payments \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Gestionarea Erorilor și Retry Logic

### 1. Eșecuri de Plată
- Până la 3 tentative pentru fiecare plată eșuată
- Interval de 24 ore între tentative
- După 3 eșecuri consecutive, abonamentul este anulat automat

### 2. Token-uri Expirate
- Token-urile Netopia expiră după o perioadă (de obicei 2 ani)
- Când un token expiră, sistemul revine la plăți normale
- Utilizatorul va fi notificat să reintroducă datele cardului

### 3. Monitorizarea
```javascript
// GET /api/cron/recurring-payments - Status
{
  "status": "healthy",
  "statistics": {
    "activeRecurring": 25,
    "pendingPayments": 5,
    "failedRecurring": 2,
    "tokenizedPayments": 20 // Plăți cu token salvat
  }
}
```

## Securitatea Token-urilor

### 1. Stocarea Sigură
- Token-urile sunt stocate encrypt în baza de date
- Nu se afișează niciodată în interfață (doar primele 10 caractere în log-uri)
- Accesul la token-uri este restricționat prin autentificare

### 2. Validarea
- Token-urile sunt validate înainte de utilizare
- Verificare automată a expirării
- Ștergerea automată a token-urilor invalide

## Avantajele Plăților Automat Recurente

### Pentru Utilizatori
- **Comoditate**: Nu trebuie să reintroducă datele cardului lunar
- **Siguranță**: Datele cardului nu sunt stocate de aplicația ta
- **Transparență**: Notificări despre fiecare plată efectuată

### Pentru Business
- **Rate de retenție mai mari**: Reducerea abandonului din cauza plăților complicate
- **Cash flow predictibil**: Plăți automate la timp
- **Costuri reduse**: Eliminarea suportului pentru reintroducerea datelor

## Implementarea Frontend

### 1. Buton pentru Plăți Automate
```jsx
import { useState } from 'react';

function AutoRecurringSetup({ planId }) {
  const [loading, setLoading] = useState(false);

  const setupAutoRecurring = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment/setup-recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId,
          enableAutoRecurring: true 
        })
      });

      const data = await response.json();
      if (data.success) {
        // Redirecționează către Netopia
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error('Error setting up auto-recurring:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={setupAutoRecurring}
      disabled={loading}
      className="btn btn-primary"
    >
      {loading ? 'Se procesează...' : 'Activează Plăți Automate'}
    </button>
  );
}
```

### 2. Status Plăți Automate
```jsx
function RecurringStatus({ userId }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch(`/api/subscription?userId=${userId}`)
      .then(res => res.json())
      .then(data => setStatus(data));
  }, [userId]);

  if (status?.hasAutoRecurring) {
    return (
      <div className="alert alert-success">
        ✅ Plăți automate activate - următoarea plată pe {status.nextChargeDate}
      </div>
    );
  }

  return (
    <div className="alert alert-warning">
      ⚠️ Plăți manuale - va trebui să reintroduci datele cardului lunar
    </div>
  );
}
```

## Troubleshooting

### 1. Token-urile nu se salvează
- Verificați că câmpul `tokenId` este inclus în răspunsul IPN
- Asigurați-vă că tokenizarea este activată în panoul Netopia
- Verificați log-urile pentru erori de procesare IPN

### 2. Plăți recurente eșuate
- Verificați validitatea token-urilor
- Confirmați că API-ul de plăți recurente funcționează
- Verificați log-urile cron job-ului

### 3. Erori de configurare
```bash
# Testarea configurației
curl -X GET https://your-domain.com/api/cron/recurring-payments \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Actualizări Viitoare

### Funcționalități Planificate
- [ ] Dashboard pentru gestionarea token-urilor
- [ ] Notificări email pentru plăți automate
- [ ] Opțiuni de pausare temporară a abonamentelor
- [ ] Suport pentru multiple carduri per utilizator
- [ ] Rapoarte detaliate de utilizare token-uri

## Concluzie

Plățile automat recurente prin tokenizarea Netopia oferă cea mai bună experiență pentru utilizatori și cea mai mare stabilitate pentru business. Odată configurate corect, acestea reduc semnificativ abandonul abonamentelor și îmbunătățesc fluxul de numerar. 