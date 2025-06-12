import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NetopiaV2, formatBillingInfo } from '@/lib/netopia-v2';

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
      where: { clerkId: session.userId }
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
        subscriptionType: plan.name,
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

    // Initialize Netopia v2.x client
    const netopia = new NetopiaV2({
      apiKey: process.env.NETOPIA_API_KEY!,
      posSignature: process.env.NETOPIA_POS_SIGNATURE!,
      isProduction: process.env.NODE_ENV === 'production'
    });

    // Prepare URLs for v2.x
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const notifyUrl = process.env.NETOPIA_NOTIFY_URL || `${baseUrl}/api/netopia/ipn`;
    const redirectUrl = process.env.NETOPIA_RETURN_URL || `${baseUrl}/api/netopia/return`;
    
    // Format billing information for v2.x
    const formattedBilling = formatBillingInfo({
      firstName: user.firstName || 'Customer',
      lastName: user.lastName || 'User',
      email: user.email || '',
      phone: '0700000000', // Default phone since not required in user model
      address: 'Default Address', // Default address since not required in user model
      city: user.city || 'Bucharest',
      postalCode: '010000' // Default postal code
    });

    // Create hosted payment (v2.x)
    const paymentResult = await netopia.createHostedPayment({
      orderID: orderId,
      amount,
      currency: 'RON',
      description: `Subscription payment for ${plan.name} plan`,
      billing: formattedBilling,
      redirectUrl,
      notifyUrl,
      language: 'ro'
    });

    return NextResponse.json({
      success: true,
      redirectUrl: paymentResult.redirectUrl,
      formData: paymentResult.formData,
      orderId
    });

  } catch (error: any) {
    console.error('[PAYMENT_START_ERROR_V2]', error);
    return new NextResponse(error.message || "Internal Server Error", { 
      status: error.status || 500 
    });
  }
} 