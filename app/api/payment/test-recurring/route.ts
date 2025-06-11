import { NextRequest, NextResponse } from "next/server";
import { NetopiaV2, formatBillingInfo } from "@/lib/netopia-v2";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Verifică autorizarea pentru testare
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized - test endpoint" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      test = false, 
      orderToken, 
      amount = 29.99, 
      currency = 'RON',
      orderId 
    } = body;

    if (!test) {
      return NextResponse.json({ error: "This is a test-only endpoint" }, { status: 400 });
    }

    console.log('[TEST_RECURRING] Starting manual token-based payment test...');

    // Găsește o comandă existentă cu token sau folosește token-ul furnizat
    let testOrder;
    let token = orderToken;

    if (orderId) {
      testOrder = await prisma.order.findUnique({
        where: { orderId },
        include: { user: true, plan: true }
      });
      
      if (!testOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      
      token = testOrder.token;
    }

    if (!token) {
      return NextResponse.json({ 
        error: "No token provided. Use 'orderToken' parameter or 'orderId' of existing order with token" 
      }, { status: 400 });
    }

    // Inițializează Netopia
    const netopia = new NetopiaV2({
      apiKey: process.env.NETOPIA_API_KEY!,
      posSignature: process.env.NETOPIA_POS_SIGNATURE!,
      isProduction: process.env.NODE_ENV === 'production'
    });

    // Generează ID nou pentru plata de test
    const testOrderId = `TEST_MANUAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Folosește date de test pentru billing
    const billingInfo = formatBillingInfo({
      firstName: testOrder?.user?.firstName || 'Test',
      lastName: testOrder?.user?.lastName || 'Recurring',
      email: testOrder?.user?.email || 'test-recurring@example.com',
      phone: '0700000000',
      address: 'Test Address for Recurring Payment',
      city: testOrder?.user?.city || 'București',
      postalCode: '010000'
    });

    // URL pentru notificări
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const notifyUrl = `${baseUrl}/api/netopia/ipn`;

    console.log('[TEST_RECURRING] Attempting recurring payment with token:', token.substring(0, 15) + '...');

    // Încearcă plata recurentă cu token
    const paymentResult = await netopia.createRecurringPayment({
      orderID: testOrderId,
      amount: amount,
      currency: currency,
      description: `TEST - Plată recurentă automată cu token`,
      token: token,
      billing: billingInfo,
      notifyUrl: notifyUrl
    });

    console.log('[TEST_RECURRING] Payment result:', paymentResult);

    if (paymentResult.success) {
      // Opțional: salvează comanda de test în baza de date
      if (testOrder) {
        await prisma.order.create({
          data: {
            orderId: testOrderId,
            userId: testOrder.userId,
            planId: testOrder.planId,
            amount: amount,
            currency: currency,
            status: 'PENDING',
            subscriptionType: testOrder.subscriptionType,
            isRecurring: true,
            token: token
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Plată recurentă testată cu succes!',
        testOrderId: testOrderId,
        ntpID: paymentResult.ntpID,
        status: paymentResult.status,
        details: {
          amount: amount,
          currency: currency,
          token: token.substring(0, 15) + '...',
          billingEmail: billingInfo.email
        }
      });

    } else {
      return NextResponse.json({
        success: false,
        message: 'Plata recurentă a eșuat',
        error: paymentResult.error,
        details: {
          amount: amount,
          currency: currency,
          token: token.substring(0, 15) + '...'
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[TEST_RECURRING] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during recurring payment test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method pentru obținerea informațiilor despre testare
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Găsește comenzile cu token-uri pentru testare
    const ordersWithTokens = await prisma.order.findMany({
      where: {
        token: { not: null },
        isRecurring: true
      },
      select: {
        orderId: true,
        amount: true,
        currency: true,
        subscriptionType: true,
        token: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      message: 'Available orders for recurring payment testing',
      count: ordersWithTokens.length,
      orders: ordersWithTokens.map(order => ({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        subscriptionType: order.subscriptionType,
        status: order.status,
        hasToken: !!order.token,
        tokenPreview: order.token ? order.token.substring(0, 15) + '...' : null,
        userEmail: order.user?.email,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      })),
      testInstructions: {
        manualTest: `POST /api/payment/test-recurring with { "test": true, "orderId": "existing_order_id" }`,
        tokenTest: `POST /api/payment/test-recurring with { "test": true, "orderToken": "your_token", "amount": 29.99 }`
      }
    });

  } catch (error) {
    console.error('[TEST_RECURRING] GET Error:', error);
    return NextResponse.json({
      error: 'Failed to get test information'
    }, { status: 500 });
  }
} 