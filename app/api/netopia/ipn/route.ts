import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

// v2.x IPN Response structure conform documentației NETOPIA
interface NetopiaV2IpnData {
  ntpID: string;
  orderID: string;
  amount: number;
  currency: string;
  status: number; // Status codes conform documentației: 3=Paid, 5=Confirmed, 12=Invalid account, 15=3DS required
  paymentMethod: string;
  maskedCard?: string;
  rrn?: string;
  authCode?: string;
  errorCode?: number; // Error codes conform documentației: 0=Success, 19=Expired, 20=Insufficient funds, etc.
  errorMessage?: string;
  // Recurring payment fields
  token?: string; // Token for recurring payments
  tokenExpiryMonth?: number;
  tokenExpiryYear?: number;
  // Billing fields from original order
  phone?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: number;
  raw: any;
}

export async function POST(req: Request) {
  try {
    console.log('[NETOPIA_V2_IPN] Processing v2.x IPN notification');
    
    // Log headers pentru debugging
    console.log('[NETOPIA_V2_IPN] Request headers:', {
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent'),
      authorization: req.headers.get('authorization') ? 'Present' : 'Missing',
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer')
    });

    // Parse JSON payload (v2.x sends JSON instead of encrypted XML)
    let rawIpnData: any;
    let ipnData: NetopiaV2IpnData;
    
    try {
      rawIpnData = await req.json();
      console.log('[NETOPIA_V2_IPN] Full parsed JSON:', JSON.stringify(rawIpnData, null, 2));
      
      // Adaptez formatul de la Netopia la formatul așteptat
      if (rawIpnData.order && rawIpnData.payment) {
        // Format nou de la Netopia v2.x
        ipnData = {
          orderID: rawIpnData.order.orderID,
          ntpID: rawIpnData.payment.ntpID,
          amount: rawIpnData.payment.amount,
          currency: rawIpnData.payment.currency,
          status: rawIpnData.payment.status,
          paymentMethod: rawIpnData.payment.paymentMethod || 'card',
          maskedCard: rawIpnData.mobilpay?.pan_masked || rawIpnData.payment.maskedCard,
          rrn: rawIpnData.payment.data?.RRN,
          authCode: rawIpnData.payment.data?.AuthCode,
          errorCode: rawIpnData.payment.code !== '00' ? parseInt(rawIpnData.payment.code) : 0,
          errorMessage: rawIpnData.payment.message !== 'Approved' ? rawIpnData.payment.message : undefined,
          // Date pentru plăți recurente
          token: rawIpnData.payment.binding?.token || rawIpnData.payment.token,
          tokenExpiryMonth: rawIpnData.payment.binding?.expireMonth,
          tokenExpiryYear: rawIpnData.payment.binding?.expireYear,
          // Salvez și răspunsul raw pentru debugging
          raw: rawIpnData
        };
        console.log('[NETOPIA_V2_IPN] Converted to internal format:', JSON.stringify(ipnData, null, 2));
      } else {
        // Format vechi - folosește direct
        ipnData = rawIpnData;
      }
    } catch (parseError) {
      console.error('[NETOPIA_V2_IPN] Failed to parse JSON:', parseError);
      // Încearcă să citească ca text pentru debugging
      try {
        const text = await req.text();
        console.log('[NETOPIA_V2_IPN] Raw body text:', text);
      } catch (textError) {
        console.error('[NETOPIA_V2_IPN] Failed to read body as text:', textError);
      }
      return new NextResponse('Invalid JSON payload', { status: 400 });
    }
    
    console.log('[NETOPIA_V2_IPN] Received data:', {
      orderID: ipnData.orderID,
      status: ipnData.status,
      amount: ipnData.amount,
      currency: ipnData.currency,
      ntpID: ipnData.ntpID,
      errorCode: ipnData.errorCode,
      errorMessage: ipnData.errorMessage,
      paymentMethod: ipnData.paymentMethod,
      maskedCard: ipnData.maskedCard,
      rrn: ipnData.rrn,
      authCode: ipnData.authCode,
      token: ipnData.token,
      tokenExpiryMonth: ipnData.tokenExpiryMonth,
      tokenExpiryYear: ipnData.tokenExpiryYear
    });

    // Validate required fields
    if (!ipnData.orderID || ipnData.status === undefined) {
      console.error('[NETOPIA_V2_IPN] Missing required fields in IPN data');
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Map v2.x status codes to our order status conform documentației NETOPIA
    let orderStatus: OrderStatus;
    let errorDescription = '';

    // Verifică întâi codurile de eroare conform documentației
    if (ipnData.errorCode !== undefined && ipnData.errorCode !== 0) {
      orderStatus = 'FAILED';
      switch (ipnData.errorCode) {
        case 19:
          errorDescription = 'Expired Card';
          break;
        case 20:
          errorDescription = 'Insufficient funds';
          break;
        case 21:
        case 22:
          errorDescription = 'CVV error';
          break;
        case 34:
          errorDescription = 'Transaction not allowed for this card';
          break;
        case 56:
          errorDescription = 'Order closed (duplicate or already completed)';
          break;
        case 99:
          errorDescription = 'Another order with a different amount';
          break;
        case 100:
          errorDescription = 'Requires 3-D Secure (or missing/invalid params)';
          break;
        default:
          errorDescription = ipnData.errorMessage || `Unknown error code: ${ipnData.errorCode}`;
      }
    } else {
      // Dacă nu e eroare, verifică status codes conform documentației
      switch (ipnData.status) {
        case 3: // Paid
        case 5: // Confirmed
          orderStatus = 'COMPLETED';
          break;
        case 12: // Invalid account
          orderStatus = 'FAILED';
          errorDescription = 'Invalid account';
          break;
        case 15: // 3-D Secure authentication required
          orderStatus = 'PENDING';
          errorDescription = '3-D Secure authentication required';
          break;
        default:
          orderStatus = 'PENDING';
          errorDescription = `Unknown status code: ${ipnData.status}`;
      }
    }

    console.log('[NETOPIA_V2_IPN] Status mapping:', {
      originalStatus: ipnData.status,
      originalErrorCode: ipnData.errorCode,
      mappedStatus: orderStatus,
      errorDescription
    });

    // Find the order in database
    const order = await prisma.order.findUnique({
      where: { orderId: ipnData.orderID },
      include: { 
        plan: true
      }
    });

    if (!order) {
      console.error('[NETOPIA_V2_IPN] Order not found:', ipnData.orderID);
      return new NextResponse('Order not found', { status: 404 });
    }

    // Find user separately since userId might be ObjectId instead of clerkId
    const user = await prisma.user.findUnique({
      where: { id: order.userId } // Assuming userId is MongoDB ObjectId
    });

    if (!user) {
      console.error('[NETOPIA_V2_IPN] User not found for order:', order.userId);
      return new NextResponse('User not found', { status: 404 });
    }

    console.log('[NETOPIA_V2_IPN] Found order:', {
      orderId: order.orderId,
      currentStatus: order.status,
      newStatus: orderStatus,
      userId: user.clerkId,
      planName: order.plan?.name,
      isRecurring: order.isRecurring,
      hasToken: !!ipnData.token
    });

    // Update order status
    await prisma.order.update({
      where: { orderId: ipnData.orderID },
      data: { 
        status: orderStatus,
        ...(errorDescription && {
          failureReason: errorDescription
        }),
        // Update payment details
        ...(orderStatus === 'COMPLETED' && {
          paidAt: new Date(),
          paymentMethod: ipnData.paymentMethod,
          transactionId: ipnData.ntpID,
          maskedCard: ipnData.maskedCard,
          // Date pentru plăți recurente
          netopiaToken: ipnData.token,
          netopiaBinding: JSON.stringify(rawIpnData.payment?.binding || {}),
          netopiaAuthCode: ipnData.authCode,
          netopiaRRN: ipnData.rrn,
          // Billing data - use fallback if not present in IPN
          billingEmail: rawIpnData.order?.invoice?.contact_info?.billing?.email || user.email || '',
          billingPhone: rawIpnData.order?.invoice?.contact_info?.billing?.mobile_phone || user.billingPhone || '',
          billingFirstName: rawIpnData.order?.invoice?.contact_info?.billing?.first_name || user.firstName || '',
          billingLastName: rawIpnData.order?.invoice?.contact_info?.billing?.last_name || user.lastName || '',
          billingAddress: rawIpnData.order?.invoice?.contact_info?.billing?.address || user.billingAddress || '',
          billingCity: rawIpnData.order?.invoice?.contact_info?.billing?.city || user.billingCity || '',
          billingState: rawIpnData.order?.invoice?.contact_info?.billing?.state || user.billingState || 'București',
          billingPostalCode: rawIpnData.order?.invoice?.contact_info?.billing?.postal_code || user.billingPostalCode || '010000',
          billingCountry: rawIpnData.order?.invoice?.contact_info?.billing?.country || user.billingCountry || 642
        })
      }
    });

    // CORECTARE MAJORĂ: Procesează automat plățile recurente
    if (orderStatus === 'COMPLETED') {
      console.log('[NETOPIA_V2_IPN] ✅ Payment successful, processing automatic completion...');
      
      try {
        // CORECTARE 1: Salvează token-ul pentru plăți recurente în USER (nu în order)
        if (ipnData.token && order.isRecurring) {
          console.log('[NETOPIA_V2_IPN] 🔑 Saving recurring token for user:', user.clerkId);
          
          let tokenExpiry = null;
          if (ipnData.tokenExpiryMonth && ipnData.tokenExpiryYear) {
            try {
              tokenExpiry = new Date(ipnData.tokenExpiryYear, ipnData.tokenExpiryMonth - 1, 1);
            } catch (e) {
              console.error('[NETOPIA_V2_IPN] Invalid token expiry date format:', ipnData.tokenExpiryMonth, ipnData.tokenExpiryYear);
            }
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              recurringToken: ipnData.token,
              tokenExpiry: tokenExpiry,
              // Save billing data from IPN response for future recurring payments - use fallback if not present
              billingPhone: rawIpnData.order?.invoice?.contact_info?.billing?.mobile_phone || user.billingPhone || '',
              billingAddress: rawIpnData.order?.invoice?.contact_info?.billing?.address || user.billingAddress || '',
              billingCity: rawIpnData.order?.invoice?.contact_info?.billing?.city || user.billingCity || '',
              billingState: rawIpnData.order?.invoice?.contact_info?.billing?.state || user.billingState || 'București',
              billingPostalCode: rawIpnData.order?.invoice?.contact_info?.billing?.postal_code || user.billingPostalCode || '010000',
              billingCountry: rawIpnData.order?.invoice?.contact_info?.billing?.country || user.billingCountry || 642,
              // Update payment method and card info
              lastPaymentMethod: ipnData.paymentMethod || 'card',
              cardExpireMonth: rawIpnData.payment?.binding?.expireMonth || 12,
              cardExpireYear: rawIpnData.payment?.binding?.expireYear || 2030,
              netopiaCustomerId: ipnData.ntpID,
              autoRenewEnabled: true,
              lastRecurringPayment: new Date()
            } as any
          });

          console.log('[NETOPIA_V2_IPN] ✅ Recurring token saved for automatic future payments');
        }

        // CORECTARE 2: Procesează abonamentul automat
        console.log('[NETOPIA_V2_IPN] 📅 Processing subscription automatically...');

        // Calculate subscription end date (30 days from now for new, extend existing)
        let endDate = new Date();
        
        // Find existing subscription
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            status: 'active'
          }
        });

        if (existingSubscription) {
          // CORECTARE 3: Pentru plăți recurente, extinde abonamentul existent
          if (order.isRecurring || order.orderId.includes('AUTO_REC_') || order.orderId.includes('CRON_AUTO_')) {
            console.log('[NETOPIA_V2_IPN] 🔄 Extending existing subscription for recurring payment');
            endDate = new Date(existingSubscription.endDate || new Date());
            endDate.setDate(endDate.getDate() + 30); // Adaugă 30 zile la data existentă
          } else {
            // Pentru plăți noi, începe de la data curentă
            endDate.setDate(endDate.getDate() + 30);
          }

          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              plan: order.subscriptionType || 'Basic',
              status: 'active',
              endDate: endDate,
              updatedAt: new Date()
            }
          });

          console.log('[NETOPIA_V2_IPN] ✅ Subscription extended to:', endDate.toLocaleDateString('ro-RO'));
        } else {
          // Create new subscription
          endDate.setDate(endDate.getDate() + 30);
          
          await prisma.subscription.create({
            data: {
              userId: user.id,
              plan: order.subscriptionType || 'Basic',
              status: 'active',
              startDate: new Date(),
              endDate: endDate
            }
          });

          console.log('[NETOPIA_V2_IPN] ✅ New subscription created until:', endDate.toLocaleDateString('ro-RO'));
        }

        // CORECTARE 4: Actualizează planul utilizatorului
        await prisma.user.update({
          where: { clerkId: user.clerkId },
          data: { 
            planType: (order.subscriptionType as 'Basic' | 'Bronze' | 'Premium' | 'Gold') || 'Basic'
          }
        });

        console.log('[NETOPIA_V2_IPN] ✅ User plan updated to:', order.subscriptionType);

        // CORECTARE 5: Notificare automată pentru plăți de succes
        await sendPaymentSuccessNotification({
          userEmail: user.email || '',
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          planName: order.subscriptionType || 'Basic',
          amount: order.amount,
          currency: order.currency,
          endDate: endDate,
          orderID: order.orderId,
          transactionId: ipnData.ntpID,
          isRecurring: order.isRecurring,
          tokenSaved: !!ipnData.token
        });

        console.log('[NETOPIA_V2_IPN] ✅ Payment processing completed successfully');

      } catch (subscriptionError) {
        console.error('[NETOPIA_V2_IPN] ❌ Error processing subscription:', subscriptionError);
        // Don't fail the IPN if subscription update fails
      }
    }

    // CORECTARE 6: Procesează automat plățile eșuate
    if (orderStatus === 'FAILED') {
      console.log('[NETOPIA_V2_IPN] ❌ Payment failed, processing failure...');
      
      try {
        // Pentru plăți recurente eșuate, notifică utilizatorul
        if (order.isRecurring) {
          await sendPaymentFailureNotification({
            userEmail: user.email || '',
            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
            planName: order.subscriptionType || 'Basic',
            error: errorDescription,
            orderID: order.orderId
          });

          // Marchează abonamentul ca problematic dacă e recurent
          const subscription = await prisma.subscription.findFirst({
            where: { userId: user.id, status: 'active' }
          });

          if (subscription) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: 'payment_failed'
              }
            });
          }
        }
      } catch (failureError) {
        console.error('[NETOPIA_V2_IPN] Error processing failure:', failureError);
      }
    }

    console.log('[NETOPIA_V2_IPN] ✅ IPN processed successfully');
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('[NETOPIA_V2_IPN_ERROR]', error);
    return new NextResponse('Error processing IPN', { status: 500 });
  }
}

// CORECTARE 7: Funcție pentru notificări de succes
async function sendPaymentSuccessNotification(params: {
  userEmail: string;
  userName: string;
  planName: string;
  amount: number;
  currency: string;
  endDate: Date;
  orderID: string;
  transactionId: string;
  isRecurring: boolean;
  tokenSaved: boolean;
}) {
  try {
    console.log('[NETOPIA_V2_IPN] 📧 Sending success notification to:', params.userEmail);
    
    const subject = params.isRecurring 
      ? `Abonamentul ${params.planName} a fost reînnoit automat! ✅`
      : `Plata pentru ${params.planName} a fost completată cu succes! ✅`;

    console.log('[NETOPIA_V2_IPN] Success notification details:', {
      to: params.userEmail,
      subject: subject,
      content: {
        userName: params.userName,
        planName: params.planName,
        amount: `${params.amount} ${params.currency}`,
        endDate: params.endDate.toLocaleDateString('ro-RO'),
        orderID: params.orderID,
        transactionId: params.transactionId,
        isRecurring: params.isRecurring,
        tokenSaved: params.tokenSaved,
        recurringSetup: params.tokenSaved ? 'Plățile viitoare vor fi automate' : null
      }
    });

    // TODO: Implementează trimiterea efectivă de email de succes
    
  } catch (error) {
    console.error('[NETOPIA_V2_IPN] Failed to send success notification:', error);
  }
}

// CORECTARE 8: Funcție pentru notificări de eșec
async function sendPaymentFailureNotification(params: {
  userEmail: string;
  userName: string;
  planName: string;
  error: string;
  orderID: string;
}) {
  try {
    console.log('[NETOPIA_V2_IPN] 📧 Sending failure notification to:', params.userEmail);
    
    console.log('[NETOPIA_V2_IPN] Failure notification details:', {
      to: params.userEmail,
      subject: `⚠️ Problema cu plata pentru ${params.planName}`,
      content: {
        userName: params.userName,
        planName: params.planName,
        error: params.error,
        orderID: params.orderID,
        action: 'Te rugăm să încerci din nou sau să contactezi suportul'
      }
    });

    // TODO: Implementează trimiterea efectivă de email de eșec
    
  } catch (error) {
    console.error('[NETOPIA_V2_IPN] Failed to send failure notification:', error);
  }
} 