import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncUserPlanTypes() {
  try {
    console.log('Starting planType synchronization...');

    // Get all active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active'
      },
      include: {
        user: {
          select: {
            id: true,
            clerkId: true,
            email: true,
            planType: true
          }
        }
      }
    });

    console.log(`Found ${activeSubscriptions.length} active subscriptions`);

    for (const subscription of activeSubscriptions) {
      if (subscription.user.planType !== subscription.plan) {
        console.log(`Updating user ${subscription.user.email} from ${subscription.user.planType} to ${subscription.plan}`);
        
        await prisma.user.update({
          where: {
            id: subscription.userId
          },
          data: {
            planType: subscription.plan
          }
        });
      }
    }

    console.log('Synchronization completed!');
  } catch (error) {
    console.error('Error during synchronization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncUserPlanTypes(); 