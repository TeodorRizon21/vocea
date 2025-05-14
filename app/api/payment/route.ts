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

type PlanType = 'Basic' | 'Premium' | 'Gold';

// Plan hierarchy and prices
const PLAN_HIERARCHY: Record<PlanType, number> = {
  Basic: 1,
  Premium: 2,
  Gold: 3
};

const PLAN_PRICES: Record<PlanType, number> = {
  Basic: 0,
  Premium: 8,
  Gold: 28
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { subscriptionType, billingInfo } = body;

    // Validate subscription type
    if (!subscriptionType || !Object.keys(PLAN_HIERARCHY).includes(subscriptionType)) {
      return new NextResponse("Invalid subscription type", { status: 400 });
    }

    if (!billingInfo) {
      return new NextResponse("Billing information is required", { status: 400 });
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
    
    // If upgrading from an active plan, calculate the price difference
    if (currentSubscription?.status === 'active' && currentSubscription.plan && currentSubscription.endDate) {
      const currentPlanPrice = PLAN_PRICES[currentSubscription.plan as PlanType];
      const remainingDays = Math.ceil(
        (new Date(currentSubscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = 30; // Assuming 30-day subscription periods
      
      // Calculate prorated refund for current plan
      const proratedRefund = (currentPlanPrice * remainingDays) / totalDays;
      
      // Calculate final amount (new plan price - prorated refund)
      amount = Math.max(0, amount - proratedRefund);
    }

    // Generate a unique order ID
    const orderId = `SUB_${Date.now()}`;

    // Get encrypted payment request with amount and billing info
    const paymentRequest = getRequest(orderId, amount, billingInfo);

    // Log the payment request details
    console.log('Payment Request Details:', {
      orderId,
      amount,
      currentPlan: currentSubscription?.plan,
      newPlan: subscriptionType,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mobilpay/return`,
      confirmUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mobilpay/ipn`,
      ipnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mobilpay/ipn`,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    });

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
    console.error('[PAYMENT_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 