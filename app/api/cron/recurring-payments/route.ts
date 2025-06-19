import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NetopiaV2, formatBillingInfo } from '@/lib/netopia-v2';
import { clerkClient } from '@clerk/nextjs/server';

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

    // CORECTARE: Găsește abonamente care expiră în următoarele 3 zile SAU au expirat deja
    const now = new Date();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        endDate: {
          lte: threeDaysFromNow // Abonamente care expiră în 3 zile sau au expirat
        }
      },
      include: {
        user: true,
        planModel: true
      }
    });

    const validSubscriptions = expiredSubscriptions;

    console.log(`[RECURRING_CRON] Found ${expiredSubscriptions.length} subscriptions expiring soon or expired`);
    console.log(`[RECURRING_CRON] Processing ${validSubscriptions.length} valid subscriptions`);

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

    for (const subscription of validSubscriptions) {
      try {
        results.processed++;
        
        console.log(`[RECURRING_CRON] Processing subscription ${subscription.id} for user ${subscription.user.clerkId}`);

        // 🎯 LOGICA NOUĂ: Găsește ultima plată SUB reușită pentru acest user
        const lastSuccessfulSubOrder = await prisma.order.findFirst({
          where: {
            userId: subscription.userId,
            orderId: {
              startsWith: 'SUB_'
            },
            status: 'COMPLETED',
            token: {
              not: null
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (!lastSuccessfulSubOrder) {
          console.log(`[RECURRING_CRON] No successful SUB order found for user ${subscription.user.clerkId}, skipping automatic renewal`);
          
          // Marchează că abonamentul nu poate fi reînnoit automat
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'expired'
            }
          });
          
          continue;
        }

        console.log(`[RECURRING_CRON] Found source SUB order: ${lastSuccessfulSubOrder.orderId} for user ${subscription.user.clerkId}`);

        // 🎯 LOGICA NOUĂ: Găsește planul CURENT al utilizatorului
        const currentUserPlanType = subscription.user.planType;
        console.log(`[RECURRING_CRON] User ${subscription.user.clerkId} current plan: ${currentUserPlanType}`);

        // Găsește planul corect din baza de date (nu din subscription expirat!)
        const currentPlan = await prisma.plan.findUnique({
          where: { name: currentUserPlanType }
        });

        if (!currentPlan) {
          console.error(`[RECURRING_CRON] Plan ${currentUserPlanType} not found in database for user ${subscription.user.clerkId}`);
          results.errors.push(`Plan ${currentUserPlanType} not found for user ${subscription.user.clerkId}`);
          continue;
        }

        console.log(`[RECURRING_CRON] 🎯 CORRECT PAYMENT DATA:`, {
          oldSubscriptionPlan: subscription.planModel?.name,
          oldSubscriptionPrice: subscription.planModel?.price,
          currentUserPlan: currentUserPlanType,
          correctPrice: currentPlan.price,
          difference: `${subscription.planModel?.price || 0} → ${currentPlan.price}`,
          sourceOrderId: lastSuccessfulSubOrder.orderId,
          sourceOrderToken: lastSuccessfulSubOrder.token ? '✅ Available' : '❌ Missing'
        });

        // 🎯 LOGICA NOUĂ: Folosește datele de billing din order-ul sursă SUB
        const billingInfo = {
          firstName: lastSuccessfulSubOrder.billingFirstName || subscription.user.firstName || 'Customer',
          lastName: lastSuccessfulSubOrder.billingLastName || subscription.user.lastName || 'User',
          email: lastSuccessfulSubOrder.billingEmail || subscription.user.email || '',
          phone: lastSuccessfulSubOrder.billingPhone || subscription.user.billingPhone || '0700000000',
          address: lastSuccessfulSubOrder.billingAddress || subscription.user.billingAddress || 'Adresă București',
          city: lastSuccessfulSubOrder.billingCity || subscription.user.billingCity || 'București',
          postalCode: lastSuccessfulSubOrder.billingPostalCode || subscription.user.billingPostalCode || '010000',
          country: lastSuccessfulSubOrder.billingCountry || subscription.user.billingCountry || 642 // Romania
        };

        // 🎯 LOGICA NOUĂ: Folosește tokenul din order-ul sursă SUB
        const recurringToken = lastSuccessfulSubOrder.token;
        if (!recurringToken) {
          console.error(`[RECURRING_CRON] No recurring token in source order ${lastSuccessfulSubOrder.orderId} for user ${subscription.user.clerkId}`);
          results.errors.push(`No recurring token in source order for user ${subscription.user.clerkId}`);
          continue;
        }

        // Generează un nou ID de comandă pentru această plată recurentă
        const newOrderId = `CRON_AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(`[RECURRING_CRON] 🎯 Using EXACT payment data from SUB order:`, {
          clerkId: subscription.user.clerkId,
          email: billingInfo.email,
          name: `${billingInfo.firstName} ${billingInfo.lastName}`,
          planName: currentPlan.name,
          amount: currentPlan.price,
          sourceOrderId: lastSuccessfulSubOrder.orderId,
          sourceOrderToken: recurringToken.substring(0, 20) + '...'
        });

        // URL-uri pentru callback-uri
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const notifyUrl = `${baseUrl}/api/netopia/ipn`;

        // 🎯 LOGICA NOUĂ: Folosește datele exacte din order-ul SUB pentru recurență
        console.log(`[RECURRING_CRON] Creating AUTOMATIC recurring payment using SUB order data for: ${billingInfo.email} - Plan: ${currentPlan.name} - Amount: ${currentPlan.price} RON`);
        
        const paymentResult = await netopia.createRecurringPayment({
          orderID: newOrderId,
          amount: currentPlan.price,
          currency: currentPlan.currency || 'RON',
          description: `Reînnoire automată abonament ${currentPlan.name}`,
          token: recurringToken, // 🎯 TOKENUL DIN ORDER-UL SUB!
          billing: {
            ...billingInfo,
            state: billingInfo.city, // Pentru România, folosim orașul ca județ dacă nu avem altă informație
            country: billingInfo.country.toString() // Convertim numărul în string
          }, // 🎯 BILLING-UL DIN ORDER-UL SUB!
          notifyUrl
        });

        console.log(`[RECURRING_CRON] Payment result for ${billingInfo.email}:`, {
          success: paymentResult.success,
          ntpID: paymentResult.ntpID,
          status: paymentResult.status
        });

        if (paymentResult.success) {
          // Determină status-ul pe baza răspunsului Netopia
          let orderStatus = 'PENDING';
          let subscriptionStatus = 'pending_payment';
          let shouldExtendSubscription = false;
          
          if (paymentResult.status === 3 || paymentResult.status === 5) {
            // Plată completă automată (RARĂ)
            orderStatus = 'COMPLETED';
            subscriptionStatus = 'active';
            shouldExtendSubscription = true;
            console.log(`[RECURRING_CRON] ✅ Plată automată completă pentru ${billingInfo.email}`);
          } else if (paymentResult.status === 1) {
            // Plată inițiată - necesită completare user
            orderStatus = 'PENDING_USER_ACTION';
            subscriptionStatus = 'pending_payment';
            console.log(`[RECURRING_CRON] ⏰ Plată inițiată pentru ${billingInfo.email} - necesită completare`);
            console.log(`[RECURRING_CRON] Payment URL: ${paymentResult.paymentURL}`);
          }
          
          // Creează o nouă comandă pentru această plată recurentă
          const newOrder = await prisma.order.create({
            data: {
              orderId: newOrderId,
              amount: currentPlan.price,
              currency: currentPlan.currency || 'RON',
              status: orderStatus as any,
              isRecurring: true,
              subscriptionType: currentPlan.name as any,
              userId: subscription.userId,
              planId: currentPlan.id,
              token: recurringToken, // 🎯 TOKENUL DIN ORDER-UL SUB!
              netopiaId: paymentResult.ntpID,
              paidAt: shouldExtendSubscription ? new Date() : null,
              lastError: paymentResult.paymentURL ? `Payment URL: ${paymentResult.paymentURL}` : null,
              // 🎯 BILLING INFO DIN ORDER-UL SUB!
              billingEmail: billingInfo.email,
              billingPhone: billingInfo.phone,
              billingFirstName: billingInfo.firstName,
              billingLastName: billingInfo.lastName,
              billingAddress: billingInfo.address,
              billingCity: billingInfo.city,
              billingPostalCode: billingInfo.postalCode,
              billingCountry: billingInfo.country
            }
          });

          // CORECTARE: Extinde abonamentul automat cu 30 zile
          const newEndDate = new Date(subscription.endDate);
          newEndDate.setDate(newEndDate.getDate() + 30);

          // 🎯 ACTUALIZEAZĂ SUBSCRIPTION-UL CU DATELE CORECTE
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              endDate: newEndDate,
              status: 'active', // Asigură-te că rămâne activ
              planId: currentPlan.id,
              plan: currentPlan.name,
              amount: currentPlan.price,
              currency: currentPlan.currency || 'RON',
              updatedAt: new Date()
            }
          });

          // CORECTARE: Trimite notificare automată
          if (paymentResult.ntpID) {
            await sendAutomaticRenewalNotification({
              userEmail: billingInfo.email,
              userName: `${billingInfo.firstName} ${billingInfo.lastName}`,
              planName: currentPlan.name,
              amount: currentPlan.price,
              currency: currentPlan.currency || 'RON',
              newEndDate: newEndDate,
              orderID: newOrderId,
              transactionId: paymentResult.ntpID
            });
          } else {
            console.warn(`[RECURRING_CRON] No transaction ID available for order ${newOrderId}`);
          }

          results.successful++;
          console.log(`[RECURRING_CRON] ✅ Successfully renewed subscription for ${billingInfo.email} until ${newEndDate.toLocaleDateString('ro-RO')} - Plan: ${currentPlan.name} - Amount: ${currentPlan.price} RON`);

        } else {
          // Plata a eșuat
          console.error(`[RECURRING_CRON] ❌ Payment failed for ${billingInfo.email}:`, paymentResult.error);
          
          // Creează comandă failed pentru tracking
          await prisma.order.create({
            data: {
              orderId: newOrderId,
              amount: currentPlan.price,
              currency: currentPlan.currency || 'RON',
              status: 'FAILED',
              isRecurring: true,
              subscriptionType: currentPlan.name as any,
              userId: subscription.userId,
              planId: currentPlan.id,
              token: recurringToken, // 🎯 TOKENUL DIN ORDER-UL SUB!
              lastError: paymentResult.error?.toString() || 'Automatic payment failed',
              // 🎯 BILLING INFO DIN ORDER-UL SUB!
              billingEmail: billingInfo.email,
              billingPhone: billingInfo.phone,
              billingFirstName: billingInfo.firstName,
              billingLastName: billingInfo.lastName,
              billingAddress: billingInfo.address,
              billingCity: billingInfo.city,
              billingPostalCode: billingInfo.postalCode,
              billingCountry: billingInfo.country
            }
          });

          // Marchează abonamentul ca expirat
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'expired'
            }
          });

          // Actualizează planul utilizatorului la Basic
          await prisma.user.update({
            where: { id: subscription.userId },
            data: {
              planType: 'Basic'
            }
          });

          // Trimite notificare de eșec
          await sendPaymentFailureNotification({
            userEmail: billingInfo.email,
            userName: `${billingInfo.firstName} ${billingInfo.lastName}`,
            planName: currentPlan.name,
            error: paymentResult.error?.toString() || 'Payment failed'
          });

          results.failed++;
        }

      } catch (error) {
        console.error(`[RECURRING_CRON] Error processing subscription ${subscription.id}:`, error);
        results.failed++;
        results.errors.push(`Subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`[RECURRING_CRON] Processing completed:`, {
      processed: results.processed,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors.length
    });

    return NextResponse.json({
      success: true,
      message: 'Recurring payments processing completed',
      results
    });

  } catch (error) {
    console.error('[RECURRING_CRON] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Funcții helper pentru notificări (dacă nu există deja)
async function sendAutomaticRenewalNotification(data: {
  userEmail: string;
  userName: string;
  planName: string;
  amount: number;
  currency: string;
  newEndDate: Date;
  orderID: string;
  transactionId: string;
}) {
  console.log(`[RECURRING_CRON] Sending renewal notification to ${data.userEmail}`);
  // Implementează logica de notificare aici
}

async function sendPaymentFailureNotification(data: {
  userEmail: string;
  userName: string;
  planName: string;
  error: string;
}) {
  console.log(`[RECURRING_CRON] Sending failure notification to ${data.userEmail}`);
  // Implementează logica de notificare aici
}