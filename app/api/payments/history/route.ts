import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { Plan } from '@prisma/client';

interface PlanMap {
  [key: string]: Plan;
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

    // Use a simpler query without including plan relationship
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Manually fetch plans separately to avoid null planId errors
    const planIds = orders
      .map(order => order.planId)
      .filter(planId => planId !== null && planId !== undefined);
    
    const plans = await prisma.plan.findMany({
      where: {
        id: {
          in: planIds
        }
      }
    });
    
    // Create a map of planId to plan for easy lookup
    const planMap: PlanMap = plans.reduce((map: PlanMap, plan) => {
      map[plan.id] = plan;
      return map;
    }, {});
    
    // Manually join the plans with the orders
    const ordersWithPlans = orders.map(order => {
      return {
        ...order,
        plan: order.planId && planMap[order.planId] ? planMap[order.planId] : null
      };
    });
    
    // Log orders for debugging
    console.log(`Found ${orders.length} orders for user ${user.id}, with ${plans.length} plans`);
    
    return NextResponse.json(ordersWithPlans);
  } catch (error) {
    console.error('[PAYMENTS_HISTORY_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 