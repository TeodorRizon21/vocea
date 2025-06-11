import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NetopiaV2 } from '@/lib/netopia-v2';

// Disable SSL verification in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('SSL verification disabled for development environment in payment API');
}

// Plan types
type PlanType = 'Bronze' | 'Basic' | 'Premium' | 'Gold';

// Plan hierarchy and prices
const PLAN_HIERARCHY: Record<PlanType, number> = {
  Bronze: 1,
  Basic: 2,
  Premium: 3,
  Gold: 4
};

const PLAN_PRICES: Record<PlanType, number> = {
  Bronze: 3.8,
  Basic: 0,
  Premium: 8,
  Gold: 28
};

// Initialize Netopia client
const netopiaClient = new NetopiaV2({
  apiKey: process.env.NETOPIA_API_KEY || '',
  posSignature: process.env.NETOPIA_POS_SIGNATURE || '',
  isProduction: process.env.NODE_ENV === 'production'
});

// Log environment variables
console.log('Payment API Environment Variables (v2.x):', {
  hasPosSignature: !!process.env.NETOPIA_POS_SIGNATURE,
  hasReturnUrl: !!process.env.NETOPIA_RETURN_URL,
  hasNotifyUrl: !!process.env.NETOPIA_NOTIFY_URL,
  environment: process.env.NODE_ENV
});

export async function POST(req: Request) {
  try {
    console.log('[PAYMENT_START] Initiating payment request with Netopia v2.x');
    
    const session = await auth();
    if (!session?.userId) {
      console.log('[PAYMENT_ERROR] No user session found');
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log('[PAYMENT_AUTH] User authenticated:', session.userId);

    const body = await req.json();
    console.log('[PAYMENT_BODY] Request body:', {
      ...body,
      billingInfo: body.billingInfo ? {
        ...body.billingInfo,
        email: body.billingInfo.email ? '***@***' : undefined,
        phone: body.billingInfo.phone ? '***' : undefined
      } : undefined
    });

    const { subscriptionType, billingInfo } = body;

    // Validate subscription type
    if (!subscriptionType || !Object.keys(PLAN_HIERARCHY).includes(subscriptionType)) {
      console.log('[PAYMENT_ERROR] Invalid subscription type:', subscriptionType);
      return new NextResponse("Invalid subscription type", { status: 400 });
    }

    // Validate billing info
    const missingFields = [];
    if (!billingInfo) missingFields.push('billingInfo');
    else {
      if (!billingInfo.firstName) missingFields.push('firstName');
      if (!billingInfo.lastName) missingFields.push('lastName');
      if (!billingInfo.email) missingFields.push('email');
      if (!billingInfo.phone) missingFields.push('phone');
      if (!billingInfo.address) missingFields.push('address');
      if (!billingInfo.city) missingFields.push('city');
      if (!billingInfo.postalCode) missingFields.push('postalCode');
    }

    if (missingFields.length > 0) {
      console.log('[PAYMENT_ERROR] Missing billing fields:', missingFields);
      return new NextResponse(`Invalid billing information. Missing fields: ${missingFields.join(', ')}`, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingInfo.email)) {
      console.log('[PAYMENT_ERROR] Invalid email format:', billingInfo.email);
      return new NextResponse("Invalid email format", { status: 400 });
    }

    // Validate phone format
    const phoneRegex = /^\+?\d{10,}$/;
    if (!phoneRegex.test(billingInfo.phone.replace(/\s+/g, ''))) {
      console.log('[PAYMENT_ERROR] Invalid phone format:', billingInfo.phone);
      return new NextResponse("Invalid phone number format", { status: 400 });
    }

    // Check required environment variables
    if (!process.env.NETOPIA_POS_SIGNATURE) {
      console.error('[PAYMENT_ERROR] NETOPIA_POS_SIGNATURE not configured');
      return new NextResponse("Payment configuration error", { status: 500 });
    }

    // Get the user and their current subscription
    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Get current active subscription
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['active', 'cancelled']
        },
        endDate: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate upgrade difference (simple price difference)
    let finalAmount = PLAN_PRICES[subscriptionType as PlanType];
    let isUpgrade = false;
    let upgradeInfo = null;

    if (currentSubscription) {
      const currentPlan = currentSubscription.plan as PlanType;
      const newPlan = subscriptionType as PlanType;
      
      // Check if this is an upgrade (higher hierarchy number)
      if (PLAN_HIERARCHY[newPlan] > PLAN_HIERARCHY[currentPlan]) {
        isUpgrade = true;
        
        const currentPlanPrice = PLAN_PRICES[currentPlan];
        const newPlanPrice = PLAN_PRICES[newPlan];
        const priceDifference = newPlanPrice - currentPlanPrice;
        
        // Simple difference - pay only the difference between plans
        finalAmount = priceDifference;
        
        // Ensure minimum payment of 1 RON
        if (finalAmount < 1) {
          finalAmount = 1;
        }
        
        upgradeInfo = {
          currentPlan,
          newPlan,
          currentPlanPrice,
          newPlanPrice,
          priceDifference,
          finalAmount: parseFloat(finalAmount.toFixed(2))
        };
      }
    }

    // Generate order ID
    const orderId = `SUB_${Date.now()}`;

    // Set up return and notify URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/api/netopia/return`;
    const notifyUrl = `${baseUrl}/api/webhooks/netopia`;
    const cancelUrl = `${baseUrl}/subscriptions?error=payment_cancelled`;

    console.log('Payment Request Details:', {
      orderId,
      originalAmount: PLAN_PRICES[subscriptionType as PlanType],
      finalAmount,
      currentPlan: currentSubscription?.plan,
      newPlan: subscriptionType,
      isUpgrade,
      upgradeInfo,
      notifyUrl,
      redirectUrl: returnUrl,
      cancelUrl
    });

    // Create payment request
    const result = await netopiaClient.createHostedPayment({
      orderID: orderId,
      amount: finalAmount,
      currency: 'RON',
      description: isUpgrade 
        ? `Upgrade to ${subscriptionType} plan (pro-rata: ${finalAmount} RON)`
        : `Subscription payment for ${subscriptionType} plan`,
      billing: {
        ...billingInfo,
        country: 'RO', // Use country code instead of full name
        state: billingInfo.city // Use city as state if not provided
      },
      redirectUrl: returnUrl,
      notifyUrl: notifyUrl,
      language: 'ro',
      payment: {
        options: {
          installments: 1
        },
        instrument: {
          type: 'card'
        },
        data: {
          BROWSER_USER_AGENT: req.headers.get('user-agent')?.split(' (')[0] || 'Unknown',
          OS: 'Windows',
          OS_VERSION: '10',
          MOBILE: 'false',
          BROWSER_COLOR_DEPTH: '24',
          BROWSER_SCREEN_WIDTH: '1920',
          BROWSER_SCREEN_HEIGHT: '1080',
          BROWSER_JAVA_ENABLED: 'false',
          BROWSER_LANGUAGE: 'ro-RO',
          BROWSER_TZ: 'Europe/Bucharest',
          BROWSER_TZ_OFFSET: '+02:00',
          IP_ADDRESS: req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1'
        }
      }
    });

    console.log('[NETOPIA_V2] Full response:', result);

    if (!result.redirectUrl) {
      console.error('[PAYMENT_ERROR] No payment URL in response');
      return new NextResponse("Payment initialization failed", { status: 500 });
    }

    // Find or create the plan
    const plan = await prisma.plan.findFirst({
      where: { name: subscriptionType }
    });

    if (!plan) {
      console.error('[PAYMENT_ERROR] Plan not found:', subscriptionType);
      return new NextResponse("Invalid plan", { status: 400 });
    }

    // Update plan price if needed
    await prisma.plan.updateMany({
      where: { id: plan.id },
      data: {
        price: PLAN_PRICES[subscriptionType as PlanType],
        currency: 'RON'
      }
    });

    // Create order with pro-rata amount
    const order = await prisma.order.create({
      data: {
        orderId,
        userId: user.id,
        planId: plan.id,
        amount: finalAmount,
        currency: 'RON',
        status: 'PENDING',
        subscriptionType,
        isRecurring: true,
        failureCount: 0
      }
    });

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      formData: {}, // Netopia v2 doesn't need form data
      orderId: order.orderId,
      isUpgrade,
      upgradeInfo: upgradeInfo ? {
        originalPrice: upgradeInfo.newPlanPrice,
        finalAmount: upgradeInfo.finalAmount,
        savings: parseFloat((upgradeInfo.newPlanPrice - upgradeInfo.finalAmount).toFixed(2)),
        message: `Upgrade de la ${upgradeInfo.currentPlan} la ${upgradeInfo.newPlan} - plăți doar diferența: ${upgradeInfo.finalAmount} RON`
      } : null
    });

  } catch (error) {
    console.error('[PAYMENT_ERROR] Payment initialization failed:', error);
    return new NextResponse(
      error instanceof Error ? error.message : "Payment initialization failed",
      { status: 500 }
    );
  }
} 