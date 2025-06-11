import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NetopiaV2, formatBillingInfo } from '@/lib/netopia-v2';

export async function POST(request: Request) {
  try {
    console.log('[RECURRING_CRON] Starting recurring payments processing');
    
    // Verifică header-ul de autorizare pentru cron (pentru securitate)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[RECURRING_CRON] Unauthorized access attempt');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Găsește toate comenzile recurente care trebuie procesate
    // Căutăm comenzi completate de cel puțin 30 zile pentru a simula următoarea încărcare
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const ordersToProcess = await prisma.order.findMany({
      where: {
        isRecurring: true,
        status: 'COMPLETED',
        createdAt: {
          lte: thirtyDaysAgo // Comenzi mai vechi de 30 zile
        },
        failureCount: {
          lt: 3 // Nu procesa comenzile care au eșuat de 3 ori
        }
      },
      include: {
        user: true,
        plan: true
      }
    });

    console.log(`[RECURRING_CRON] Found ${ordersToProcess.length} orders to process`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Inițializează clientul Netopia
    const netopia = new NetopiaV2({
      apiKey: process.env.NETOPIA_API_KEY!,
      posSignature: process.env.NETOPIA_POS_SIGNATURE!,
      isProduction: process.env.NODE_ENV === 'production'
    });

    for (const order of ordersToProcess) {
      try {
        results.processed++;
        
        console.log(`[RECURRING_CRON] Processing order ${order.orderId} for user ${order.user.clerkId}`);

        // Verifică că utilizatorul încă are un abonament activ
        const subscription = await prisma.subscription.findFirst({
          where: { userId: order.userId }
        });

        if (!subscription || subscription.status !== 'active') {
          console.log(`[RECURRING_CRON] Subscription not active for user ${order.user.clerkId}, skipping`);
          
          // Marchează comanda cu o eroare
          await prisma.order.update({
            where: { id: order.id },
            data: {
              lastError: 'Subscription no longer active'
            }
          });
          
          continue;
        }

        // Generează un nou ID de comandă pentru această plată recurentă
        const newOrderId = `REC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Pregătește informațiile de facturare
        const billingInfo = formatBillingInfo({
          firstName: order.user.firstName || 'Customer',
          lastName: order.user.lastName || 'User',
          email: order.user.email || '',
          phone: '0700000000',
          address: 'Default Address',
          city: order.user.city || 'București',
          postalCode: '010000'
        });

        // URL-uri pentru callback-uri
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const notifyUrl = `${baseUrl}/api/netopia/ipn`;
        const redirectUrl = `${baseUrl}/api/netopia/return?orderId=${newOrderId}`;

        let paymentResult;

        if (order.token) {
          // Folosește tokenul salvat pentru plăți complet automate
          console.log(`[RECURRING_CRON] Using saved token for automatic payment: ${order.orderId}`);
          
          paymentResult = await netopia.createRecurringPayment({
            orderID: newOrderId,
            amount: order.amount,
            currency: order.currency,
            description: `Abonament ${order.plan.name} - Plată recurentă automată`,
            token: order.token,
            billing: billingInfo,
            notifyUrl
          });
        } else {
          // Fallback la plăți normale dacă nu există token (utilizatorul va trebui să reintroducă datele)
          console.log(`[RECURRING_CRON] No token found, creating regular payment: ${order.orderId}`);
          
          paymentResult = await netopia.createHostedPayment({
            orderID: newOrderId,
            amount: order.amount,
            currency: order.currency,
            description: `Abonament ${order.plan.name} - Plată recurentă`,
            billing: billingInfo,
            notifyUrl,
            redirectUrl,
            language: 'ro'
          });
        }

        const isSuccess = ('success' in paymentResult && paymentResult.success) || 
                         ('redirectUrl' in paymentResult && paymentResult.redirectUrl);
        
        if (isSuccess) {
          // Creează o nouă comandă pentru această plată recurentă
          await prisma.order.create({
            data: {
              orderId: newOrderId,
              amount: order.amount,
              currency: order.currency,
              status: 'PENDING',
              isRecurring: true,
              subscriptionType: order.subscriptionType,
              userId: order.userId,
              planId: order.planId
            }
          });

          // Actualizează comanda originală
          await prisma.order.update({
            where: { id: order.id },
            data: {
              failureCount: 0,
              lastError: null
            }
          });

          results.successful++;
          console.log(`[RECURRING_CRON] Successfully processed payment for order ${order.orderId}`);

        } else {
          // Gestionează eșecul plății
          const newFailureCount = order.failureCount + 1;
          const maxFailures = 3;

          await prisma.order.update({
            where: { id: order.id },
            data: {
              failureCount: newFailureCount,
              lastError: paymentResult.error?.toString() || 'Payment failed'
            }
          });

          if (newFailureCount >= maxFailures) {
            // Anulează abonamentul după 3 eșecuri consecutive
            const subscriptionToCancel = await prisma.subscription.findFirst({
              where: { userId: order.userId }
            });
            
            if (subscriptionToCancel) {
              await prisma.subscription.update({
                where: { id: subscriptionToCancel.id },
                data: {
                  status: 'cancelled',
                  endDate: now
                }
              });
            }

            // Actualizează planul utilizatorului la Basic
            await prisma.user.update({
              where: { id: order.userId },
              data: {
                planType: 'Basic'
              }
            });

            console.error(`[RECURRING_CRON] Subscription cancelled for user ${order.user.clerkId} after ${maxFailures} failed payments`);
          }

          results.failed++;
          results.errors.push(`Order ${order.orderId}: ${paymentResult.error}`);
          console.error(`[RECURRING_CRON] Payment failed for order ${order.orderId}: ${paymentResult.error}`);
        }

      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Order ${order.orderId}: ${errorMessage}`);
        console.error(`[RECURRING_CRON] Error processing order ${order.orderId}:`, error);

        // Încearcă să actualizezi comanda cu eroarea
        try {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              failureCount: order.failureCount + 1,
              lastError: errorMessage
            }
          });
        } catch (updateError) {
          console.error(`[RECURRING_CRON] Failed to update order ${order.orderId} with error:`, updateError);
        }
      }
    }

    console.log('[RECURRING_CRON] Completed processing recurring payments', results);

    return NextResponse.json({
      success: true,
      message: 'Recurring payments processed',
      results
    });

  } catch (error) {
    console.error('[RECURRING_CRON] Fatal error in recurring payments cron:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Metodă GET pentru verificarea statusului cron-ului
export async function GET(req: Request) {
  try {
    // Statistici despre plățile recurente
    const activeRecurring = await prisma.order.count({
      where: {
        isRecurring: true,
        status: 'COMPLETED'
      }
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pendingPayments = await prisma.order.count({
      where: {
        isRecurring: true,
        status: 'COMPLETED',
        createdAt: {
          lte: thirtyDaysAgo
        },
        failureCount: {
          lt: 3
        }
      }
    });

    const failedRecurring = await prisma.order.count({
      where: {
        isRecurring: true,
        failureCount: {
          gte: 3
        }
      }
    });

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: {
        activeRecurring,
        pendingPayments,
        failedRecurring
      }
    });

  } catch (error) {
    console.error('[RECURRING_CRON] Error getting cron status:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 