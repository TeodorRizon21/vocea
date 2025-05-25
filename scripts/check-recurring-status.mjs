import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecurringStatus() {
  try {
    console.log('Checking recurring payment status...');
    
    // Find all recurring orders
    const orders = await prisma.order.findMany({
      where: {
        isRecurring: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true,
        plan: true
      }
    });

    console.log(`Found ${orders.length} recurring orders:`);
    
    for (const order of orders) {
      console.log('\nOrder:', {
        orderId: order.orderId,
        user: order.user.email,
        plan: order.plan.name,
        amount: order.amount,
        status: order.status,
        recurringStatus: order.recurringStatus,
        lastChargeAt: order.lastChargeAt,
        nextChargeAt: order.nextChargeAt,
        createdAt: order.createdAt
      });
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRecurringStatus(); 