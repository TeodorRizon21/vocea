# Configurare Plăți Recurente Netopia - Ghid Complet

## 📋 Cerințe de la Netopia

Conform discuției cu echipa Netopia, pentru implementarea plăților recurente sunt necesare următoarele:

### 1. 🏪 Activarea Flag-ului pentru Contul de Comerciant

**ACȚIUNE NECESARĂ:**
- Contactați Netopia pentru activarea flag-ului de plăți recurente
- Furnizați: username + semnătura/identificatorul contului
- **Username:** [COMPLETAȚI]
- **Semnătura:** [COMPLETAȚI]

### 2. 🔑 Managementul Token-urilor

**FLOW CORECT:**

1. **Prima plată standard** → Netopia trimite token în IPN
2. **Token-ul se salvează** o singură dată la prima plată
3. **⚠️ IMPORTANT:** Token-ul se trimite DOAR în primul IPN la aprobarea tranzacției
4. **Dacă nu e procesat** → Token-ul e pierdut pentru totdeauna

**IMPLEMENTARE:**
```javascript
// În IPN handler
if (ipnData.isFirstPayment && ipnData.token) {
  // Salvează token-ul IMEDIAT
  await prisma.user.update({
    where: { clerkId: userId },
    data: { 
      recurringToken: ipnData.token,
      tokenExpiry: ipnData.tokenExpiry 
    }
  });
}
```

### 3. 🔄 Plăți Ulterioare cu Token

**DATE OBLIGATORII pentru fiecare plată:**
- ✅ Nume
- ✅ Prenume  
- ✅ Email
- ✅ Adresă completă
- ✅ Telefon

**IMPORTANT:** La fiecare plată cu token se generează un token NOU care trebuie să suprascrie vechiul token.

```javascript
// După fiecare plată recurentă
if (paymentResult.newToken) {
  await prisma.user.update({
    where: { clerkId: userId },
    data: { 
      recurringToken: paymentResult.newToken,  // SUPRASCRIE vechiul token
      tokenExpiry: paymentResult.tokenExpiry 
    }
  });
}
```

## 🚀 Pași de Implementare

### Pas 1: Contactați Netopia
```
TO: support@netopia.ro
SUBJECT: Activare flag plăți recurente

Bună ziua,

Vă rog să activați flag-ul pentru plăți recurente pe contul nostru:
- Username: [COMPLETAȚI]
- Semnătura: [COMPLETAȚI]
- Site: [COMPLETAȚI]

Mulțumesc!
```

### Pas 2: Actualizați IPN Handler-ul

```javascript
// app/api/netopia/ipn/route.ts
export async function POST(request: NextRequest) {
  // ... existing code ...
  
  // CRUCIAL: Salvați token-ul la prima plată
  if (ipnData.payment.status === 3 && ipnData.payment.token) {
    const order = await prisma.order.findUnique({
      where: { orderId: ipnData.order.orderID }
    });
    
    if (order) {
      // Salvează token-ul pentru plăți viitoare
      await prisma.user.update({
        where: { clerkId: order.userId },
        data: {
          recurringToken: ipnData.payment.token,
          tokenExpiry: ipnData.payment.tokenExpiry,
          // Salvează și datele de billing pentru plăți viitoare
          billingFirstName: ipnData.order.billing.firstName,
          billingLastName: ipnData.order.billing.lastName,
          billingEmail: ipnData.order.billing.email,
          billingPhone: ipnData.order.billing.phone,
          billingAddress: ipnData.order.billing.address,
          billingCity: ipnData.order.billing.city,
          billingPostalCode: ipnData.order.billing.postalCode
        }
      });
    }
  }
}
```

### Pas 3: Actualizați Logica de Plăți Recurente

```javascript
// lib/netopia-v2.ts
async createRecurringPayment(orderDetails) {
  // TOATE datele sunt OBLIGATORII
  const requiredBillingData = {
    firstName: orderDetails.billing.firstName,    // OBLIGATORIU
    lastName: orderDetails.billing.lastName,      // OBLIGATORIU
    email: orderDetails.billing.email,            // OBLIGATORIU
    phone: orderDetails.billing.phone,            // OBLIGATORIU
    address: orderDetails.billing.address,        // OBLIGATORIU
    city: orderDetails.billing.city,              // OBLIGATORIU
    postalCode: orderDetails.billing.postalCode   // OBLIGATORIU
  };
  
  // Verifică că toate datele sunt prezente
  for (const [key, value] of Object.entries(requiredBillingData)) {
    if (!value) {
      throw new Error(`Missing required billing data: ${key}`);
    }
  }
  
  // ... rest of implementation
}
```

### Pas 4: Actualizați Token-ul După Fiecare Plată

```javascript
// În procesarea răspunsului de la plata recurentă
if (paymentResult.success && paymentResult.newToken) {
  // SUPRASCRIE vechiul token cu cel nou
  await prisma.user.update({
    where: { clerkId: userId },
    data: {
      recurringToken: paymentResult.newToken,
      tokenExpiry: paymentResult.newTokenExpiry
    }
  });
}
```

## ⚠️ Puncte Critice

1. **Token-ul se pierde dacă nu e procesat la primul IPN**
2. **Datele de billing sunt OBLIGATORII la fiecare plată**
3. **Token-ul trebuie suprascris după fiecare plată**
4. **Flag-ul trebuie activat de Netopia pe cont**

## 🧪 Testare

1. **Faceți o plată de test** și verificați că primiți token în IPN
2. **Salvați token-ul** imediat
3. **Testați plata recurentă** cu toate datele obligatorii
4. **Verificați că primiți token nou** și îl suprascriu

## 📞 Contact Netopia

- **Email:** support@netopia.ro
- **Telefon:** [COMPLETAȚI]
- **Cerere:** Activare flag plăți recurente 