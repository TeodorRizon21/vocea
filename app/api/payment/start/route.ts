import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Netopia, PaymentRequest, BillingDetails, RecurringDetails } from '@/lib/netopia';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { amount, planId, isRecurring = false } = body;

    // Validate required fields
    if (!amount || !planId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return new NextResponse("Plan not found", { status: 404 });
    }

    // Generate order ID
    const orderId = `SUB_${Date.now()}`;

    // Create order in database
    await prisma.order.create({
      data: {
        orderId,
        amount,
        currency: 'RON',
        status: 'PENDING',
        isRecurring,
        recurringStatus: isRecurring ? 'PENDING' : null,
        subscriptionType: plan.name,
        userId: session.userId,
        planId
      }
    });

    // Initialize Netopia client
    const netopia = new Netopia({
      apiKey: process.env.NETOPIA_API_KEY!,
      returnUrl: process.env.NETOPIA_RETURN_URL!,
      confirmUrl: process.env.NETOPIA_CONFIRM_URL!,
      sandbox: process.env.NODE_ENV === 'development'
    });

    // Prepare billing details
    const billing: BillingDetails = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      city: user.city || ''
    };

    // Prepare payment request
    const paymentRequest: PaymentRequest = {
      amount,
      currency: 'RON',
      orderId,
      orderName: `${plan.name} Subscription`,
      orderDesc: `Subscription payment for ${plan.name} plan`,
      billing
    };

    // Add recurring payment details if needed
    if (isRecurring) {
      const recurring: RecurringDetails = {
        interval: 'MONTH',
        intervalCount: 1,
        gracePeriod: 3,
        automaticPayment: true
      };
      paymentRequest.recurring = recurring;
    }

    const response = await netopia.startPayment(paymentRequest);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[PAYMENT_START_ERROR]', error);
    return new NextResponse(error.message || "Internal Server Error", { 
      status: error.status || 500 
    });
  }
} 