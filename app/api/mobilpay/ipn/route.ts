import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeResponse } from '@/mobilpay-sdk/order';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    console.log('--- IPN DEBUG START ---');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Read raw body as text for debugging
    const rawBody = await req.text();
    console.log('Raw IPN body (text):', rawBody);

    // Try to parse JSON body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      console.error('Failed to parse IPN body as JSON:', err);
      return new NextResponse("Malformed JSON", { status: 400 });
    }
    console.log('Parsed IPN body:', body);

    // Validate the IPN signature
    const signature = req.headers.get('x-mobilpay-signature');
    if (!signature) {
      console.error('No signature provided in IPN');
      return new NextResponse("Unauthorized: No signature", { status: 401 });
    }

    // Verify signature using your Netopia private key
    const privateKey = process.env.NETOPIA_PRIVATE_KEY;
    if (!privateKey) {
      console.error('NETOPIA_PRIVATE_KEY not configured');
      return new NextResponse("Server configuration error: No private key", { status: 500 });
    }

    const isValid = verifySignature(body, signature, privateKey);
    if (!isValid) {
      console.error('Invalid IPN signature');
      return new NextResponse("Invalid signature", { status: 401 });
    }
    console.log('IPN signature verified.');
    
    // Decode the response from Netopia
    let decodedResponse;
    try {
      decodedResponse = await decodeResponse(body);
      console.log('Decoded IPN response:', decodedResponse);
    } catch (err) {
      console.error('Failed to decode Netopia response:', err);
      return new NextResponse("Failed to decode Netopia response", { status: 400 });
    }

    // Extract transaction information
    const { order } = decodedResponse;
    const { 
      id: orderId, 
      status,
      timestamp,
      amount,
      currency,
      pan_masked: maskedCard,
      payment_instrument: paymentMethod,
      params
    } = order;

    // Check if this is a recurring payment
    const isRecurring = !!(params && params.recurring);
    const recurringDetails = isRecurring ? params.recurring : null;
    
    console.log('Transaction details:', { 
      orderId, 
      status, 
      timestamp, 
      amount, 
      currency,
      maskedCard,
      paymentMethod,
      isRecurring,
      recurringDetails
    });

    // Find the order in our database with plan details
    let orderRecord;
    try {
      orderRecord = await prisma.order.findUnique({
        where: { orderId },
        include: { 
          user: true,
          plan: true
        }
      });
    } catch (err) {
      console.error('DB error finding order:', err);
      return new NextResponse("DB error finding order", { status: 500 });
    }

    if (!orderRecord) {
      console.error('Order not found:', orderId);
      return new NextResponse("Order not found", { status: 404 });
    }
    console.log('Found order:', orderRecord);

    // Update order status and transaction details
    let updatedOrder;
    try {
      updatedOrder = await prisma.order.update({
        where: { orderId },
        data: { 
          status: status === 'approved' ? 'COMPLETED' : 'FAILED',
          updatedAt: new Date()
        }
      });
    } catch (err) {
      console.error('DB error updating order:', err);
      return new NextResponse("DB error updating order", { status: 500 });
    }

    // If payment was successful, update the user's subscription
    if (status === 'approved') {
      console.log('Payment approved, updating subscription');
      
      // Calculate subscription end date (30 days from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // Get the plan from the order
      const plan = orderRecord.plan;
      if (!plan) {
        console.error('No plan found in order:', orderId);
        return new NextResponse("Plan not found in order", { status: 400 });
      }

      // Create or update subscription with the plan from the order
      let subscription;
      try {
        subscription = await prisma.subscription.upsert({
          where: {
            userId: orderRecord.userId
          },
          create: {
            userId: orderRecord.userId,
            plan: plan.name,
            status: 'active',
            startDate,
            endDate,
            projectsPosted: 0
          },
          update: {
            plan: plan.name,
            status: 'active',
            startDate,
            endDate,
            ...(plan.name === 'Gold' ? { projectsPosted: 0 } : {})
          }
        });
      } catch (err) {
        console.error('DB error upserting subscription:', err);
        return new NextResponse("DB error upserting subscription", { status: 500 });
      }

      // Update user's plan type with the plan from the order
      let updatedUser;
      try {
        updatedUser = await prisma.user.update({
          where: {
            id: orderRecord.userId
          },
          data: {
            planType: plan.name
          }
        });
      } catch (err) {
        console.error('DB error updating user plan:', err);
        return new NextResponse("DB error updating user plan", { status: 500 });
      }

      // Create notification for the user
      let notificationMessage = `Your ${plan.name} subscription has been activated.`;
      
      if (isRecurring) {
        notificationMessage += ` Your subscription will automatically renew on ${endDate.toLocaleDateString()}.`;
      } else {
        notificationMessage += ` Your subscription is valid until ${endDate.toLocaleDateString()}.`;
      }
      
      try {
        await prisma.notification.create({
          data: {
            userId: orderRecord.user.clerkId,
            type: 'subscription',
            message: notificationMessage,
            read: false
          }
        });
      } catch (err) {
        console.error('DB error creating notification:', err);
      }

      console.log('Successfully updated subscription and user plan:', {
        orderId,
        plan: plan.name,
        subscriptionId: subscription.id,
        userId: updatedUser.id,
        isRecurring
      });
      
      // If this is a recurring payment, store the token for future use
      if (isRecurring && recurringDetails && recurringDetails.token) {
        console.log('Storing recurring payment token for future billing');
        // Here you would typically store the token in your database
        // for future automatic charges
      }
      
    } else {
      // Create notification for failed payment
      try {
        await prisma.notification.create({
          data: {
            userId: orderRecord.user.clerkId,
            type: 'payment',
            message: `Your payment for ${orderRecord.plan.name} subscription has failed. Please try again.`,
            read: false
          }
        });
      } catch (err) {
        console.error('DB error creating failed payment notification:', err);
      }
    }

    // Return success response to Netopia
    console.log('--- IPN DEBUG END ---');
    return NextResponse.json({ 
      success: true,
      message: 'IPN processed successfully',
      orderId,
      status: updatedOrder.status
    });

  } catch (error) {
    console.error('[NETOPIA_IPN_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

function verifySignature(body: any, signature: string, privateKey: string): boolean {
  try {
    // Create a string from the body in a consistent format
    const bodyString = JSON.stringify(body);
    
    // Create a hash of the body
    const hash = crypto.createHash('sha256').update(bodyString).digest('hex');
    
    // Verify the signature using the private key
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(hash);
    
    return verifier.verify(privateKey, signature, 'base64');
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
} 