import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('[NETOPIA_IPN_SIMPLE] Processing IPN notification');
    
    // Log headers pentru debugging
    const headers = {
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent'),
      verificationToken: req.headers.get('verification-token')
    };
    console.log('[NETOPIA_IPN_SIMPLE] Headers:', headers);

    // Parse JSON payload
    let rawData: any;
    try {
      rawData = await req.json();
      console.log('[NETOPIA_IPN_SIMPLE] Raw IPN data:', JSON.stringify(rawData, null, 2));
    } catch (parseError) {
      console.error('[NETOPIA_IPN_SIMPLE] Failed to parse JSON:', parseError);
      return new NextResponse('Invalid JSON payload', { status: 400 });
    }
    
    // Verifică structura de la Netopia
    if (!rawData.order || !rawData.payment) {
      console.error('[NETOPIA_IPN_SIMPLE] Invalid IPN structure - missing order or payment');
      return new NextResponse('Invalid IPN structure', { status: 400 });
    }

    // Extrage datele importante
    const orderID = rawData.order.orderID;
    const payment = rawData.payment;
    
    console.log('[NETOPIA_IPN_SIMPLE] Processed data:', {
      orderID: orderID,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      ntpID: payment.ntpID,
      code: payment.code,
      message: payment.message,
      hasToken: !!payment.token
    });

    // Validează datele obligatorii
    if (!orderID || payment.status === undefined || !payment.ntpID) {
      console.error('[NETOPIA_IPN_SIMPLE] Missing required fields');
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Determină statusul plății
    const isSuccessful = payment.status === 3 && payment.code === '00' && payment.message === 'Approved';
    
    console.log('[NETOPIA_IPN_SIMPLE] Payment analysis:', {
      isSuccessful,
      status: payment.status,
      code: payment.code,
      message: payment.message
    });

    if (isSuccessful) {
      console.log('[NETOPIA_IPN_SIMPLE] ✅ PAYMENT SUCCESSFUL!');
      console.log(`  Order: ${orderID}`);
      console.log(`  Amount: ${payment.amount} ${payment.currency}`);
      console.log(`  Netopia ID: ${payment.ntpID}`);
      console.log(`  Token present: ${!!payment.token}`);
      
      // TODO: Aici va fi implementarea pentru actualizarea bazei de date
      // - Marcarea order-ului ca COMPLETED
      // - Salvarea token-ului pentru plăți recurente
      // - Prelungirea abonamentului
      // - Trimiterea notificărilor
      
      console.log('[NETOPIA_IPN_SIMPLE] ✅ IPN processed successfully');
    } else {
      console.log('[NETOPIA_IPN_SIMPLE] ❌ PAYMENT FAILED!');
      console.log(`  Reason: Status ${payment.status}, Code ${payment.code}, Message: ${payment.message}`);
      
      // TODO: Aici va fi implementarea pentru plăți eșuate
      // - Marcarea order-ului ca FAILED
      // - Notificarea utilizatorului
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('[NETOPIA_IPN_SIMPLE] Unexpected error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 