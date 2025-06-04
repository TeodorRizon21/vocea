import { NextResponse } from 'next/server';
import { getRequest } from '@/order';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Add SSL bypass for development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('SSL verification disabled for development environment in payment API');
}

// Log environment variables for debugging
console.log('Payment API Environment Variables:', {
  hasSignature: !!process.env.NETOPIA_SIGNATURE,
  hasReturnUrl: !!process.env.NETOPIA_RETURN_URL,
  hasConfirmUrl: !!process.env.NETOPIA_CONFIRM_URL,
  hasPublicKey: !!process.env.NETOPIA_PUBLIC_KEY,
  hasPrivateKey: !!process.env.NETOPIA_PRIVATE_KEY
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
    console.log('[PAYMENT_START] Initiating payment request');
    
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
        email: body.billingInfo.email ? '***@***' : undefined, // Mask sensitive data
        phone: body.billingInfo.phone ? '***' : undefined
      } : undefined
    });

    const { subscriptionType, billingInfo } = body;

    // Validate subscription type
    if (!subscriptionType || !Object.keys(PLAN_HIERARCHY).includes(subscriptionType)) {
      console.log('[PAYMENT_ERROR] Invalid subscription type:', subscriptionType);
      return new NextResponse("Invalid subscription type", { status: 400 });
    }

    // Validate billing info with detailed logging
    const missingFields = [];
    if (!billingInfo) missingFields.push('billingInfo');
    else {
      if (!billingInfo.firstName) missingFields.push('firstName');
      if (!billingInfo.lastName) missingFields.push('lastName');
      if (!billingInfo.email) missingFields.push('email');
      if (!billingInfo.phone) missingFields.push('phone');
      if (!billingInfo.address) missingFields.push('address');
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
      
      // Log the calculation details
      console.log('Price Calculation:', {
        newPlanPrice: PLAN_PRICES[subscriptionType as PlanType],
        currentPlanPrice,
        priceDifference: amount
      });
    }

    // Generate a unique order ID
    const orderId = `SUB_${Date.now()}`;

    // Get encrypted payment request with amount and billing info
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Log the payment request details
    console.log('Payment Request Details:', {
      orderId,
      amount,
      currentPlan: currentSubscription?.plan,
      newPlan: subscriptionType,
      returnUrl: `${baseUrl}/payment/verify?orderId=${orderId}`,
      confirmUrl: `${baseUrl}/api/mobilpay/ipn`,
      ipnUrl: `${baseUrl}/api/mobilpay/ipn`,
      appUrl: baseUrl
    });

    // Log payment request details before sending
    console.log('[PAYMENT_REQUEST] Preparing payment request:', {
      orderId,
      amount,
      subscriptionType,
      urls: {
        returnUrl: `${baseUrl}/api/mobilpay/return`,
        confirmUrl: `${baseUrl}/api/mobilpay/ipn`,
        ipnUrl: `${baseUrl}/api/mobilpay/ipn`
      }
    });

    try {
      const paymentRequest = getRequest(
        orderId, 
        amount, 
        billingInfo,
        {
          returnUrl: `${baseUrl}/api/mobilpay/return`,
          confirmUrl: `${baseUrl}/api/mobilpay/ipn`,
          ipnUrl: `${baseUrl}/api/mobilpay/ipn`
        },
        'RON',
        true
      );
      
      console.log('[PAYMENT_REQUEST_SUCCESS] Payment request generated successfully');
      
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
        env_key: paymentRequest.env_key,
        data: paymentRequest.data,
        iv: paymentRequest.iv,
        cipher: paymentRequest.cipher
      });
    } catch (error) {
      console.error('[PAYMENT_REQUEST_ERROR] Error generating payment request:', error);
      return new NextResponse("Error generating payment request", { status: 500 });
    }

  } catch (error) {
    console.error('[PAYMENT_ERROR] Unexpected error:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 