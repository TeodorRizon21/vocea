import { NextRequest, NextResponse } from 'next/server';
import { NetopiaV2 } from '@/lib/netopia-v2';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('[NETOPIA_V2_RETURN] Processing return from payment');
    
    const searchParams = req.nextUrl.searchParams;
    const orderID = searchParams.get('orderID');
    const paRes = searchParams.get('paRes'); // 3DS authentication response
    const authenticationToken = searchParams.get('authenticationToken');
    const ntpID = searchParams.get('ntpID');

    console.log('[NETOPIA_V2_RETURN] Return parameters:', {
      orderID,
      hasPaRes: !!paRes,
      hasAuthToken: !!authenticationToken,
      ntpID
    });

    if (!orderID) {
      console.error('[NETOPIA_V2_RETURN] Missing orderID parameter');
      return NextResponse.redirect(new URL('/subscriptions?error=missing_order_id', req.url));
    }

    // Find the order in database
    const order = await prisma.order.findUnique({
      where: { orderId: orderID },
      include: { 
        user: true,
        plan: true
      }
    });

    if (!order) {
      console.error('[NETOPIA_V2_RETURN] Order not found:', orderID);
      return NextResponse.redirect(new URL('/subscriptions?error=order_not_found', req.url));
    }

    // If we have paRes, this is a return from 3DS authentication
    if (paRes && authenticationToken && ntpID) {
      console.log('[NETOPIA_V2_RETURN] Processing 3DS authentication response');
      
      try {
        // Initialize Netopia client
        const netopia = new NetopiaV2({
          apiKey: process.env.NETOPIA_API_KEY!,
          posSignature: process.env.NETOPIA_POS_SIGNATURE!,
          isProduction: process.env.NODE_ENV === 'production'
        });

        // Verify 3DS authentication
        const authResult = await netopia.verifyAuth({
          authenticationToken,
          ntpID,
          paRes
        });

        console.log('[NETOPIA_V2_RETURN] 3DS verification result:', {
          status: authResult.status,
          code: authResult.code,
          paymentStatus: authResult.data?.payment?.status,
          hasError: !!authResult.data?.error
        });

        // Check if payment was successful after 3DS
        if (authResult.data?.payment?.status === 3 || authResult.data?.payment?.status === 5) {
                     // Payment successful - update order status
           await prisma.order.update({
             where: { orderId: orderID },
             data: {
               status: 'COMPLETED'
             }
           });

          // Update subscription and user plan
          await updateUserSubscription(order.user.clerkId, order.subscriptionType || 'Basic');

          console.log('[NETOPIA_V2_RETURN] Payment completed successfully after 3DS');
          return NextResponse.redirect(new URL('/subscriptions?success=payment_completed', req.url));
        } else {
          // Payment failed
          const errorMessage = authResult.data?.error?.message || 'Payment verification failed';
          await prisma.order.update({
            where: { orderId: orderID },
            data: {
              status: 'FAILED',
              failureReason: errorMessage
            }
          });

          console.log('[NETOPIA_V2_RETURN] Payment failed after 3DS:', errorMessage);
          return NextResponse.redirect(new URL('/subscriptions?error=payment_failed', req.url));
        }
      } catch (error) {
        console.error('[NETOPIA_V2_RETURN] Error verifying 3DS authentication:', error);
        await prisma.order.update({
          where: { orderId: orderID },
          data: {
            status: 'FAILED',
            failureReason: 'Error processing 3DS authentication'
          }
        });
        return NextResponse.redirect(new URL('/subscriptions?error=verification_error', req.url));
      }
    }

    // For non-3DS payments or direct returns, check order status
    if (order.status === 'COMPLETED') {
      console.log('[NETOPIA_V2_RETURN] Order already completed');
      return NextResponse.redirect(new URL('/subscriptions?success=payment_completed', req.url));
    } else if (order.status === 'FAILED') {
      console.log('[NETOPIA_V2_RETURN] Order failed');
      return NextResponse.redirect(new URL('/subscriptions?error=payment_failed', req.url));
    } else {
      // Order still pending - redirect to pending page
      console.log('[NETOPIA_V2_RETURN] Order still pending');
      return NextResponse.redirect(new URL('/subscriptions?status=pending', req.url));
    }

  } catch (error) {
    console.error('[NETOPIA_V2_RETURN] Unexpected error:', error);
    return NextResponse.redirect(new URL('/subscriptions?error=processing_error', req.url));
  }
}

export async function POST(req: NextRequest) {
  // Handle POST requests for 3DS authentication returns
  try {
    console.log('[NETOPIA_V2_RETURN] Processing POST return from 3DS');
    
    const body = await req.formData();
    const paRes = body.get('paRes') as string;
    const orderID = body.get('orderID') as string;
    const authenticationToken = body.get('authenticationToken') as string;
    const ntpID = body.get('ntpID') as string;

    if (!paRes || !orderID || !authenticationToken || !ntpID) {
      console.error('[NETOPIA_V2_RETURN] Missing required 3DS parameters');
      return NextResponse.redirect(new URL('/subscriptions?error=missing_3ds_params', req.url));
    }

    // Process the same way as GET but with form data
    const searchParams = new URLSearchParams({
      orderID,
      paRes,
      authenticationToken,
      ntpID
    });

    const redirectUrl = new URL('/api/netopia/return', req.url);
    redirectUrl.search = searchParams.toString();

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('[NETOPIA_V2_RETURN] Error processing POST return:', error);
    return NextResponse.redirect(new URL('/subscriptions?error=processing_error', req.url));
  }
}

// Helper function to update user subscription
async function updateUserSubscription(userId: string, planType: string) {
  try {
    // Calculate subscription end date (1 month from now)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create or update subscription
    await prisma.subscription.upsert({
      where: {
        userId: userId
      },
      create: {
        userId: userId,
        plan: planType,
        status: 'active',
        startDate: new Date(),
        endDate
      },
      update: {
        plan: planType,
        status: 'active',
        startDate: new Date(),
        endDate
      }
    });

    // Update user's plan type
    await prisma.user.update({
      where: { clerkId: userId },
      data: { 
        planType: planType
      }
    });

    console.log('[NETOPIA_V2_RETURN] User subscription updated successfully');
  } catch (error) {
    console.error('[NETOPIA_V2_RETURN] Error updating subscription:', error);
    throw error;
  }
} 