import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// MongoDB document types
interface MongoOrder {
  _id: { toString(): string };
  orderId: string;
  userId: { toString(): string };
  planId?: { toString(): string };
  amount: number;
  currency: string;
  status: string;
  subscriptionType: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MongoResponse {
  cursor: {
    firstBatch: MongoOrder[];
  };
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First find the user record to get their MongoDB ID
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Use a raw MongoDB query to bypass Prisma validation
    // @ts-ignore - using Prisma's internal MongoDB client
    const orders: MongoResponse = await prisma.$runCommandRaw({
      find: "Order",
      filter: { userId: user.id },
      sort: { createdAt: -1 }
    });

    // Log output for debugging
    console.log(`Found ${orders?.cursor?.firstBatch?.length || 0} raw orders`);
    
    // Transform orders to a more usable format and include basic plan info
    const transformedOrders = orders?.cursor?.firstBatch?.map((order: MongoOrder) => {
      // Basic transformation of MongoDB document
      return {
        id: order._id.toString(),
        orderId: order.orderId,
        userId: order.userId.toString(),
        planId: order.planId?.toString() || null,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        subscriptionType: order.subscriptionType,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        // Add a basic plan property based on subscriptionType
        plan: {
          name: order.subscriptionType || 'Unknown'
        }
      };
    }) || [];
    
    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error('[RAW_PAYMENTS_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 