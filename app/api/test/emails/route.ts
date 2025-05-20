import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { 
  sendAccountCreationEmail,
  sendPlanUpdateEmail,
  sendPlanCancellationEmail
} from '@/lib/email';

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('✅ Authenticated user ID:', userId);

    // Get user details from Clerk
    const clerkUser = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());

    const email = clerkUser.email_addresses?.[0]?.email_address;
    console.log('📧 Clerk user details:', {
      email,
      firstName: clerkUser.first_name,
      lastName: clerkUser.last_name
    });

    if (!email) {
      console.error('❌ No email found in Clerk user data');
      return NextResponse.json({ error: 'No email found in user data' }, { status: 400 });
    }

    // Get or create user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      console.log('⚠️ User not found in database, creating...');
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email,
          firstName: clerkUser.first_name || null,
          lastName: clerkUser.last_name || null,
          isOnboarded: false
        }
      });
      console.log('✅ User created in database:', user);
    } else if (!user.email) {
      console.log('⚠️ User exists but has no email, updating...');
      user = await prisma.user.update({
        where: { clerkId: userId },
        data: { email }
      });
      console.log('✅ User updated with email:', user);
    }

    const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User';
    console.log('👤 Using name:', name);

    // Test all email types with delays between requests
    console.log('📨 Sending test emails...');
    
    // Send account creation email
    console.log('Sending account creation email...');
    const accountCreationResult = await sendAccountCreationEmail({
      name,
      email: user.email!
    });
    console.log('Account creation email result:', accountCreationResult);
    
    // Wait 1 second before next email
    await delay(1000);
    
    // Send plan update email
    console.log('Sending plan update email...');
    const planUpdateResult = await sendPlanUpdateEmail({
      name,
      email: user.email!,
      planName: 'Premium Plan',
      amount: 99.99,
      currency: 'RON'
    });
    console.log('Plan update email result:', planUpdateResult);
    
    // Wait 1 second before next email
    await delay(1000);
    
    // Send plan cancellation email
    console.log('Sending plan cancellation email...');
    const planCancellationResult = await sendPlanCancellationEmail({
      name,
      email: user.email!,
      planName: 'Premium Plan',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    console.log('Plan cancellation email result:', planCancellationResult);

    const results = {
      accountCreation: accountCreationResult,
      planUpdate: planUpdateResult,
      planCancellation: planCancellationResult
    };

    console.log('✅ Test results:', results);
    return NextResponse.json({
      success: true,
      message: 'Test emails sent successfully',
      results
    });

  } catch (error: any) {
    console.error('❌ Error sending test emails:', error);
    return NextResponse.json({ 
      error: 'Failed to send test emails',
      details: error.message 
    }, { status: 500 });
  }
} 