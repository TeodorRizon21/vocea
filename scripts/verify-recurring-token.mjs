import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { getRequest } from '../order.js';

const prisma = new PrismaClient();

async function verifyRecurringToken() {
  try {
    console.log('Verifying recurring payment token...');
    
    // Find the completed recurring order
    const order = await prisma.order.findFirst({
      where: {
        isRecurring: true,
        status: 'COMPLETED',
        recurringStatus: 'ACTIVE'
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
      status: order.status,
      recurringStatus: order.recurringStatus
    });

    // Create a token verification request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyRequest = getRequest(
      `VERIFY_${order.orderId}`,
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

    // Add token verification parameters
    verifyRequest.data = verifyRequest.data.replace(
      '<params/>',
      `<params>
        <recurring>
          <initial_order>${order.orderId}</initial_order>
          <verify_token>true</verify_token>
        </recurring>
      </params>`
    );

    console.log('Sending token verification request to Netopia...');

    // Send the verification request
    const netopiaResponse = await fetch('https://sandboxsecure.mobilpay.ro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        env_key: verifyRequest.env_key,
        data: verifyRequest.data,
        iv: verifyRequest.iv,
        cipher: verifyRequest.cipher
      })
    });

    if (!netopiaResponse.ok) {
      console.error('Token verification failed:', await netopiaResponse.text());
      return;
    }

    console.log('Token verification response:', await netopiaResponse.text());
    console.log('\nToken verification successful! The recurring payment is properly set up.');
    console.log('Netopia will automatically attempt to charge the card every 30 days.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyRecurringToken(); 