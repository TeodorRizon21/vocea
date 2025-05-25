import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateOrderDate() {
  try {
    // Find the most recent order
    const order = await prisma.order.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!order) {
      console.log('No orders found');
      return;
    }

    // Update the order to be recurring and set nextChargeAt to 1 day ago
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id
      },
      data: {
        isRecurring: true,
        recurringStatus: 'ACTIVE',
        nextChargeAt: yesterday
      }
    });

    console.log('Updated order:', {
      id: updatedOrder.id,
      orderId: updatedOrder.orderId,
      nextChargeAt: updatedOrder.nextChargeAt,
      isRecurring: updatedOrder.isRecurring,
      recurringStatus: updatedOrder.recurringStatus
    });

  } catch (error) {
    console.error('Error updating order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOrderDate(); 