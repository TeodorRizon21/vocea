import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NetopiaV2, formatBillingInfo } from '@/lib/netopia-v2';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    console.log('[RECURRING_CRON] Starting recurring payments processing');
    
    // Verifică header-ul de autorizare pentru cron (pentru securitate)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_RECURRING_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[RECURRING_CRON] Unauthorized access attempt');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // CORECTARE: Găsește abonamente care expiră în următoarele 3 zile SAU au expirat deja
    const now = new Date();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    // Find subscriptions that are expiring soon OR recently expired (within last 3 days)
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          {
            // Active subscriptions expiring within 3 days
            status: 'active',
            endDate: {
              lte: threeDaysFromNow
            }
          },
          {
            // Recently expired subscriptions (within last 3 days) that can still be renewed
            status: 'expired',
            endDate: {
              gte: threeDaysAgo, // Expired within last 3 days
              lte: now // But actually expired (not future dated)
            }
          }
        ]
      },
      include: {
        user: true,
        planModel: true
      }
    });

    const validSubscriptions = expiredSubscriptions;

    console.log(`[RECURRING_CRON] Found ${expiredSubscriptions.length} subscriptions expiring soon or recently expired`);
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

        // 🎯 LOGICA CORECTATĂ: Verifică dacă utilizatorul are token salvat pentru plăți recurente
        if (!subscription.user.recurringToken) {
          console.log(`[RECURRING_CRON] No recurring token found for user ${subscription.user.clerkId}, skipping automatic renewal`);
          
          // Marchează că abonamentul nu poate fi reînnoit automat
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'expired'
            }
          });
          
          continue;
        }

        // Verifică dacă tokenul nu a expirat
        if (subscription.user.tokenExpiry && subscription.user.tokenExpiry < new Date()) {
          console.log(`[RECURRING_CRON] Recurring token expired for user ${subscription.user.clerkId}, skipping automatic renewal`);
          
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'expired'
            }
          });
          
          continue;
        }

        console.log(`[RECURRING_CRON] Found valid recurring token for user ${subscription.user.clerkId}`);

        // 🎯 FIXED LOGIC: Renew the ORIGINAL subscription plan, not current user planType
        const originalSubscriptionPlan = subscription.plan; // Use the plan from expired subscription
        console.log(`[RECURRING_CRON] User ${subscription.user.clerkId} expired plan to renew: ${originalSubscriptionPlan}`);
        console.log(`[RECURRING_CRON] User current planType: ${subscription.user.planType} (will be updated after renewal)`);

        // Find the original plan from database (the one that expired and needs renewal)
        const originalPlan = await prisma.plan.findUnique({
          where: { name: originalSubscriptionPlan }
        });

        if (!originalPlan) {
          console.error(`[RECURRING_CRON] Plan ${originalSubscriptionPlan} not found in database for user ${subscription.user.clerkId}`);
          results.errors.push(`Plan ${originalSubscriptionPlan} not found for user ${subscription.user.clerkId}`);
          continue;
        }

        console.log(`[RECURRING_CRON] 🎯 CORRECT PAYMENT DATA:`, {
          oldSubscriptionPlan: subscription.planModel?.name,
          oldSubscriptionPrice: subscription.planModel?.price,
          currentUserPlan: originalSubscriptionPlan,
          correctPrice: originalPlan.price,
          difference: `${subscription.planModel?.price || 0} → ${originalPlan.price}`,
          userToken: subscription.user.recurringToken ? '✅ Available' : '❌ Missing',
          tokenExpiry: subscription.user.tokenExpiry
        });

        // 🎯 LOGICA CORECTATĂ: Folosește datele de billing din User (salvate în IPN)
        const billingInfo = {
          firstName: subscription.user.firstName || 'Customer',
          lastName: subscription.user.lastName || 'User',
          email: subscription.user.email || '',
          phone: subscription.user.billingPhone || '0700000000',
          address: subscription.user.billingAddress || 'Adresă București',
          city: subscription.user.billingCity || 'București',
          postalCode: subscription.user.billingPostalCode || '010000',
          country: subscription.user.billingCountry || 642 // Romania
        };

        // 🎯 LOGICA CORECTATĂ: Folosește tokenul din User
        const recurringToken = subscription.user.recurringToken;

        // Generează un nou ID de comandă pentru această plată recurentă
        const newOrderId = `CRON_AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(`[RECURRING_CRON] 🎯 Using EXACT payment data from User profile:`, {
          clerkId: subscription.user.clerkId,
          email: billingInfo.email,
          name: `${billingInfo.firstName} ${billingInfo.lastName}`,
          planName: originalPlan.name,
          amount: originalPlan.price,
          userToken: recurringToken.substring(0, 20) + '...',
          tokenExpiry: subscription.user.tokenExpiry
        });

        // URL-uri pentru callback-uri
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const notifyUrl = `${baseUrl}/api/netopia/ipn`;

        // 🎯 LOGICA CORECTATĂ: Folosește datele din User pentru recurență
        console.log(`[RECURRING_CRON] Creating AUTOMATIC recurring payment using User profile data for: ${billingInfo.email} - Plan: ${originalPlan.name} - Amount: ${originalPlan.price} RON`);
        
        const paymentResult = await netopia.createRecurringPayment({
          orderID: newOrderId,
          amount: originalPlan.price,
          currency: originalPlan.currency || 'RON',
          description: `Reînnoire automată abonament ${originalPlan.name}`,
          token: recurringToken, // 🎯 TOKENUL DIN USER!
          billing: {
            ...billingInfo,
            state: billingInfo.city, // Pentru România, folosim orașul ca județ dacă nu avem altă informație
            country: billingInfo.country.toString() // Convertim numărul în string
          }, // 🎯 BILLING-UL DIN USER!
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
              amount: originalPlan.price,
              currency: originalPlan.currency || 'RON',
              status: orderStatus as any,
              isRecurring: true,
              subscriptionType: originalPlan.name as any,
              userId: subscription.userId,
              planId: originalPlan.id,
              token: recurringToken, // 🎯 TOKENUL DIN USER!
              netopiaId: paymentResult.ntpID,
              paidAt: shouldExtendSubscription ? new Date() : null,
              lastError: paymentResult.paymentURL ? `Payment URL: ${paymentResult.paymentURL}` : null,
              // 🎯 BILLING INFO DIN USER!
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
              planId: originalPlan.id,
              plan: originalPlan.name,
              amount: originalPlan.price,
              currency: originalPlan.currency || 'RON',
              updatedAt: new Date()
            }
          });

          // CORECTARE: Trimite notificare automată
          if (paymentResult.ntpID) {
            await sendAutomaticRenewalNotification({
              userEmail: billingInfo.email,
              userName: `${billingInfo.firstName} ${billingInfo.lastName}`,
              planName: originalPlan.name,
              amount: originalPlan.price,
              currency: originalPlan.currency || 'RON',
              newEndDate: newEndDate,
              orderID: newOrderId,
              transactionId: paymentResult.ntpID
            });
          } else {
            console.warn(`[RECURRING_CRON] No transaction ID available for order ${newOrderId}`);
          }

          // Update user's planType to match the renewed subscription
          await prisma.user.update({
            where: { id: subscription.userId },
            data: {
              planType: originalPlan.name
            }
          });
          console.log(`[RECURRING_CRON] ✅ Updated user planType from ${subscription.user.planType} to ${originalPlan.name}`);

          results.successful++;
          console.log(`[RECURRING_CRON] ✅ Successfully renewed subscription for ${billingInfo.email} until ${newEndDate.toLocaleDateString('ro-RO')} - Plan: ${originalPlan.name} - Amount: ${originalPlan.price} RON`);

        } else {
          // Plata a eșuat
          console.error(`[RECURRING_CRON] ❌ Payment failed for ${billingInfo.email}:`, paymentResult.error);
          
          // Creează comandă failed pentru tracking
          await prisma.order.create({
            data: {
              orderId: newOrderId,
              amount: originalPlan.price,
              currency: originalPlan.currency || 'RON',
              status: 'FAILED',
              isRecurring: true,
              subscriptionType: originalPlan.name as any,
              userId: subscription.userId,
              planId: originalPlan.id,
              token: recurringToken, // 🎯 TOKENUL DIN USER!
              lastError: paymentResult.error?.toString() || 'Automatic payment failed',
              // 🎯 BILLING INFO DIN USER!
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
            planName: originalPlan.name,
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