import { NextRequest, NextResponse } from 'next/server';
import { NetopiaV2 } from '@/lib/netopia-v2';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('[NETOPIA_RETURN] Processing return request');
    
    // Get URL parameters
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    const errorCode = url.searchParams.get('errorCode');
    const errorMessage = url.searchParams.get('errorMessage');

    console.log('[NETOPIA_RETURN] Parameters:', {
      orderId,
      errorCode,
      errorMessage
    });

    if (!orderId) {
      console.error('[NETOPIA_RETURN] No orderId provided');
      return new NextResponse('Missing orderId', { status: 400 });
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderId }
    });

    if (!order) {
      console.error('[NETOPIA_RETURN] Order not found:', orderId);
      return new NextResponse('Order not found', { status: 404 });
    }

    // Build redirect URL based on order status
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let redirectUrl = '';

    // Check if there are immediate error parameters from Netopia
    if (errorCode || errorMessage) {
      // Immediate failure from Netopia
      redirectUrl = `${baseUrl}/payment/failed?orderId=${orderId}`;
      if (errorMessage) {
        redirectUrl += `&message=${encodeURIComponent(errorMessage)}`;
      }
    } else {
      // Check order status from database
      if (order.status === 'COMPLETED') {
        // Payment successful
        redirectUrl = `${baseUrl}/payment/success?orderId=${orderId}`;
      } else if (order.status === 'FAILED') {
        // Payment failed  
        redirectUrl = `${baseUrl}/payment/failed?orderId=${orderId}`;
        if (order.lastError) {
          redirectUrl += `&message=${encodeURIComponent(order.lastError)}`;
        }
      } else {
        // Payment still pending - redirect to a pending page or show status
        redirectUrl = `${baseUrl}/subscriptions?status=pending&orderId=${orderId}`;
      }
    }

    console.log('[NETOPIA_RETURN] Redirecting to:', redirectUrl);

    // Return redirect response
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl
      }
    });
  } catch (error) {
    console.error('[NETOPIA_RETURN] Error processing return:', error);
    
    // Redirect to failed page with error
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const errorUrl = `${baseUrl}/payment/failed?message=${encodeURIComponent('An unexpected error occurred during payment processing')}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: errorUrl
      }
    });
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

    // Get user's MongoDB ID first
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create or update subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['active', 'cancelled']
        }
      }
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: {
          id: existingSubscription.id
        },
        data: {
        plan: planType,
        status: 'active',
        startDate: new Date(),
        endDate
      }
    });
    } else {
      // This function doesn't have access to order details, so we can't create a full subscription
      // In practice, this function might not be used for creating new subscriptions
      console.warn('Cannot create new subscription without order details');
    }

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