import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NetopiaV2, formatBillingInfo } from '@/lib/netopia-v2';

// Add SSL bypass for development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('SSL verification disabled for development environment in payment API');
}

// Log environment variables for debugging
console.log('Payment API Environment Variables (v2.x):', {
  hasPosSignature: !!process.env.NETOPIA_POS_SIGNATURE,
  hasReturnUrl: !!process.env.NETOPIA_RETURN_URL,
  hasNotifyUrl: !!process.env.NETOPIA_NOTIFY_URL,
  environment: process.env.NODE_ENV
});

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
        userId: session.userId,
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

    // Check if user can purchase the requested plan
    if (currentSubscription?.plan) {
      const currentPlanRank = PLAN_HIERARCHY[currentSubscription.plan as PlanType];
      const requestedPlanRank = PLAN_HIERARCHY[subscriptionType as PlanType];

      // Prevent downgrade if current plan is active
      if (requestedPlanRank < currentPlanRank) {
        return new NextResponse(
          "Cannot downgrade to a lower plan while current plan is active. Please wait until your current plan expires.", 
          { status: 400 }
        );
      }

      // If same plan, prevent purchase unless expired
      if (requestedPlanRank === currentPlanRank) {
        return new NextResponse(
          "You already have this plan. Please wait until your current plan expires to purchase it again.", 
          { status: 400 }
        );
      }
    }

    // Calculate amount based on subscription type and current plan
    let amount = PLAN_PRICES[subscriptionType as PlanType];
    
    // If upgrading from an active plan, just charge the difference
    if (currentSubscription?.status === 'active' && currentSubscription.plan) {
      const currentPlanPrice = PLAN_PRICES[currentSubscription.plan as PlanType];
      amount = Math.round((amount - currentPlanPrice) * 100) / 100;
      
      console.log('Price Calculation:', {
        newPlanPrice: PLAN_PRICES[subscriptionType as PlanType],
        currentPlanPrice,
        priceDifference: amount
      });
    }

    // Generate a unique order ID
    const orderId = `SUB_${Date.now()}`;

    // Prepare URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const notifyUrl = process.env.NETOPIA_NOTIFY_URL || `${baseUrl}/api/netopia/ipn`;
    const redirectUrl = process.env.NETOPIA_RETURN_URL || `${baseUrl}/api/netopia/return`;
    const cancelUrl = `${baseUrl}/subscriptions?error=payment_cancelled`;

    console.log('Payment Request Details:', {
      orderId,
      amount,
      currentPlan: currentSubscription?.plan,
      newPlan: subscriptionType,
      notifyUrl,
      redirectUrl,
      cancelUrl
    });

    try {
      // Check for required environment variables
      if (!process.env.NETOPIA_API_KEY || !process.env.NETOPIA_POS_SIGNATURE) {
        console.error('[PAYMENT_API] Missing NETOPIA configuration');
        return NextResponse.json(
          { error: 'Payment configuration error' },
          { status: 500 }
        );
      }

      // Initialize Netopia v2.x client
      const netopia = new NetopiaV2({
        apiKey: process.env.NETOPIA_API_KEY,
        posSignature: process.env.NETOPIA_POS_SIGNATURE!,
        isProduction: false // REVERTED: Înapoi la sandbox pentru debug
      });

      // Format billing information for Netopia v2.x
      const formattedBilling = formatBillingInfo(billingInfo);

      // Create hosted payment (Netopia handles the payment form)
      const paymentResult = await netopia.createHostedPayment({
        orderID: orderId,
        amount,
        currency: 'RON',
        description: `Subscription payment for ${subscriptionType} plan`,
        billing: formattedBilling,
        redirectUrl,
        notifyUrl,
        language: 'ro'
      });

      console.log('[NETOPIA_V2] Hosted payment created successfully');
      
      // Find or create the plan
      const plan = await prisma.plan.upsert({
        where: {
          name: subscriptionType
        },
        create: {
          name: subscriptionType,
          price: PLAN_PRICES[subscriptionType as PlanType],
          currency: 'RON',
          features: subscriptionType === 'Premium' 
            ? ['Unlimited projects', 'Priority support'] 
            : ['Unlimited projects', 'Priority support', 'Advanced features']
        },
        update: {
          price: PLAN_PRICES[subscriptionType as PlanType],
          currency: 'RON'
        }
      });
      
      // Store the order in the database
      await prisma.order.create({
        data: {
          orderId,
          amount,
          currency: 'RON',
          status: 'PENDING',
          subscriptionType,
          isRecurring: true, // Enable recurring for subscriptions
          user: {
            connect: {
              id: user.id
            }
          },
          plan: {
            connect: {
              id: plan.id
            }
          }
        }
      });
      
      return NextResponse.json({
        success: true,
        redirectUrl: paymentResult.redirectUrl,
        formData: paymentResult.formData,
        orderId
      });

    } catch (error) {
      console.error('[NETOPIA_V2] Error creating payment:', error);
      return new NextResponse(
        error instanceof Error ? error.message : "Error creating payment", 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PAYMENT_ERROR] Unexpected error:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 