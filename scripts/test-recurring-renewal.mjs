import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { getRequest } from '../order.js';

const prisma = new PrismaClient();

async function testRecurringRenewal() {
  try {
    console.log('Testing recurring payment renewal (1-minute test)...');
    
    // Find any active recurring order
    const order = await prisma.order.findFirst({
      where: {
        isRecurring: true,
        recurringStatus: 'ACTIVE',
        status: 'COMPLETED' // Only use completed orders
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true,
        plan: true
      }
    });

    if (!order) {
      console.error('No completed recurring order found');
      return;
    }

    console.log('Found completed recurring order:', {
      orderId: order.orderId,
      user: order.user.email,
      plan: order.plan.name,
      amount: order.amount,
      currentNextChargeAt: order.nextChargeAt
    });

    // Update the nextChargeAt to 1 minute from now
    const nextChargeAt = new Date(Date.now() + 60 * 1000); // 1 minute
    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id
      },
      data: {
        nextChargeAt
      }
    });

    console.log('Updated order nextChargeAt to:', nextChargeAt);
    console.log('Waiting for 1 minute before triggering renewal...');

    // Wait for 1 minute
    await new Promise(resolve => setTimeout(resolve, 60 * 1000));

    // Create a new order for the renewal
    const newOrderId = `SUB_${Date.now()}`;
    console.log('Creating new order for renewal:', newOrderId);

    await prisma.order.create({
      data: {
        orderId: newOrderId,
        amount: order.amount,
        currency: 'RON',
        status: 'PENDING',
        isRecurring: true,
        recurringStatus: 'ACTIVE',
        subscriptionType: order.plan.name,
        userId: order.userId,
        planId: order.planId
      }
    });

    // Create the recurring payment request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentRequest = getRequest(
      newOrderId,
      order.amount,
      {
        firstName: order.user.firstName || 'Test',
        lastName: order.user.lastName || 'User',
        email: order.user.email || '',
        phone: '1234567890',
        address: 'Test Address'
      },
      {
        returnUrl: `${baseUrl}/api/mobilpay/return`,
        confirmUrl: `${baseUrl}/api/mobilpay/ipn`,
        ipnUrl: `${baseUrl}/api/mobilpay/ipn`
      }
    );

    // Add recurring payment parameters with token
    paymentRequest.data = paymentRequest.data.replace(
      '<params/>',
      `<params>
        <recurring>
          <initial_order>${order.orderId}</initial_order>
          <payment_type>merchant_agreement</payment_type>
          <frequency>1</frequency>
          <interval>DAY</interval>
          <grace_period>0</grace_period>
        </recurring>
      </params>`
    );

    console.log('Sending recurring payment request to Netopia...');

    // Send the payment request
    const netopiaResponse = await fetch('https://sandboxsecure.mobilpay.ro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        env_key: paymentRequest.env_key,
        data: paymentRequest.data,
        iv: paymentRequest.iv,
        cipher: paymentRequest.cipher
      })
    });

    if (!netopiaResponse.ok) {
      console.error('Failed to send payment request:', await netopiaResponse.text());
      process.exit(1);
    }

    console.log('Payment request sent successfully');
    console.log('Monitoring for payment completion...');

    // Monitor the order status for 30 seconds
    let attempts = 0;
    const maxAttempts = 6; // 6 attempts * 5 seconds = 30 seconds
    const checkInterval = 5000; // 5 seconds

    const checkPayment = async () => {
      const refreshedOrder = await prisma.order.findUnique({
        where: { orderId: newOrderId }
      });

      console.log('Order status:', {
        orderId: refreshedOrder.orderId,
        status: refreshedOrder.status,
        nextChargeAt: refreshedOrder.nextChargeAt
      });

      if (refreshedOrder.status === 'COMPLETED') {
        console.log('✅ Renewal payment successful!');
        process.exit(0);
      }

      attempts++;
      if (attempts >= maxAttempts) {
        console.log('❌ Payment not completed after 30 seconds');
        process.exit(1);
      } else {
        console.log(`⏳ Checking again in 5 seconds... (${maxAttempts - attempts} attempts remaining)`);
        setTimeout(checkPayment, checkInterval);
      }
    };

    // Start checking after 5 seconds
    setTimeout(checkPayment, 5000);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testRecurringRenewal(); 