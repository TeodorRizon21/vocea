import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NetopiaV2, formatBillingInfo } from "@/lib/netopia-v2";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, enableAutoRecurring = true } = body;

    // Get user information
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get plan information
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Generate unique order ID
    const orderId = `SETUP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderId: orderId,
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'PENDING',
        subscriptionType: plan.name,
        isRecurring: enableAutoRecurring
      }
    });

    // Initialize Netopia
    const netopia = new NetopiaV2({
      apiKey: process.env.NETOPIA_API_KEY!,
      posSignature: process.env.NETOPIA_POS_SIGNATURE!,
      isProduction: process.env.NODE_ENV === 'production'
    });

    // Prepare billing information
    const billingInfo = formatBillingInfo({
      firstName: user.firstName || 'Customer',
      lastName: user.lastName || 'User',
      email: user.email || '',
      phone: '0700000000',
      address: user.city || 'Str. Universității nr. 1',
      city: user.city || 'București',
      postalCode: '010000'
    });

    // Set up URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const notifyUrl = `${baseUrl}/api/netopia/ipn`;
    const redirectUrl = `${baseUrl}/payment/success?orderId=${orderId}`;

    // Create hosted payment with tokenization enabled
    const paymentResult = await netopia.createHostedPayment({
      orderID: orderId,
      amount: plan.price,
      currency: plan.currency,
      description: enableAutoRecurring 
        ? `Configurare plată automată - ${plan.name}` 
        : `Abonament ${plan.name}`,
      billing: billingInfo,
      notifyUrl,
      redirectUrl,
      language: 'ro'
    });

    if (paymentResult.redirectUrl) {
      return NextResponse.json({
        success: true,
        redirectUrl: paymentResult.redirectUrl,
        orderId: orderId,
        message: enableAutoRecurring 
          ? 'Plata a fost inițiată. După completarea cu succes, viitoarele plăți vor fi automate.' 
          : 'Plata a fost inițiată.'
      });
    } else {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: 'FAILED',
          lastError: 'Failed to create payment URL'
        }
      });

      return NextResponse.json({
        success: false,
        error: 'Failed to create payment'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[SETUP_RECURRING] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 