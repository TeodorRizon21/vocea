import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { Order, Plan } from '@prisma/client';

type OrderWithPlan = Order & {
  plan: Plan;
};

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

    let orders: OrderWithPlan[] = [];
    
    try {
      // Now use the MongoDB user ID to find their orders
      orders = await prisma.order.findMany({
        where: {
          userId: user.id
        },
        include: {
          plan: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // Log orders for debugging
      console.log(`Found ${orders.length} orders for user ${user.id}`);
    } catch (dbError) {
      console.error('Error fetching orders:', dbError);
      // Return empty array instead of failing
      orders = [];
    }
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('[PAYMENTS_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 