import { NextResponse } from 'next/server';
import { getRequest } from '@/mobilpay-sdk/order';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Log environment variables for debugging
console.log('Payment API Environment Variables:', {
  hasSignature: !!process.env.NETOPIA_SIGNATURE,
  hasReturnUrl: !!process.env.NETOPIA_RETURN_URL,
  hasConfirmUrl: !!process.env.NETOPIA_CONFIRM_URL,
  hasPublicKey: !!process.env.NETOPIA_PUBLIC_KEY,
  hasPrivateKey: !!process.env.NETOPIA_PRIVATE_KEY
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { subscriptionType } = body;

    if (!subscriptionType) {
      return new NextResponse("Subscription type is required", { status: 400 });
    }

    // Calculate amount based on subscription type
    const amount = subscriptionType === 'Premium' ? 8 : 28;

    // Generate a unique order ID
    const orderId = `SUB_${Date.now()}`;

    // Get encrypted payment request with amount
    const paymentRequest = getRequest(orderId, amount);

    // First get the user to get their MongoDB ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId: session.userId
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Find or create the plan
    const plan = await prisma.plan.upsert({
      where: {
        name: subscriptionType
      },
      create: {
        name: subscriptionType,
        price: amount,
        currency: 'RON',
        features: subscriptionType === 'Premium' 
          ? ['Unlimited projects', 'Priority support'] 
          : ['Unlimited projects', 'Priority support', 'Advanced features']
      },
      update: {
        price: amount,
        currency: 'RON'
      }
    });
    
    // Calculate recurring billing dates
    const startDate = new Date();
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30); // 30 days from now
    
    // Store the order in the database using the MongoDB ID
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
    
    // Update or create subscription with recurring info
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        userId: session.userId
      }
    });
    
    if (existingSubscription) {
      await prisma.subscription.update({
        where: {
          id: existingSubscription.id
        },
        data: {
          plan: subscriptionType,
          status: 'active',
          startDate,
          endDate: nextBillingDate
        }
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: session.userId,
          plan: subscriptionType,
          status: 'active',
          startDate,
          endDate: nextBillingDate
        }
      });
    }

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