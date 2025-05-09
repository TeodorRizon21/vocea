import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';
import { generateNetopiaPaymentFields } from '@/lib/netopia';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionType } = body;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Define subscription prices
    const prices = {
      Basic: 0,
      Premium: 8,
      Gold: 28,
    };

    // Generate a unique order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prepare payment data for Netopia
    const { envKey, data } = generateNetopiaPaymentFields({
      orderId,
      amount: prices[subscriptionType as keyof typeof prices],
      currency: 'RON',
      description: `${subscriptionType} Subscription Payment`,
      billing: {
        firstName: user.firstName || 'Nume',
        lastName: user.lastName || 'Prenume',
        email: user.email || 'test@mobilpay.ro',
        address: 'strada', // required by Netopia, use a placeholder if not available
        mobilePhone: '0700000000', // required, use a placeholder if not available
      },
      returnUrl: 'https://voceacampusului.ro/payment/return',
      confirmUrl: 'https://voceacampusului.ro/api/payment/webhook',
    });

    // Store the order in the database
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          orderId,
          userId: user.id,
          amount: prices[subscriptionType as keyof typeof prices],
          currency: 'RON',
          status: 'PENDING',
          subscriptionType,
        },
      });

      // Create or update subscription record
      const existingSubscription = await tx.subscription.findFirst({
        where: {
          userId: userId,
        },
      });

      if (existingSubscription) {
        await tx.subscription.update({
          where: {
            id: existingSubscription.id,
          },
          data: {
            plan: subscriptionType,
            status: 'pending',
            startDate: new Date(),
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            userId: userId,
            plan: subscriptionType,
            status: 'pending',
            startDate: new Date(),
          },
        });
      }
    });

    // Return the form fields to the frontend
    return NextResponse.json({ envKey, data });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
} 