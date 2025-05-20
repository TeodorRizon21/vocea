import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  sendAccountCreationEmail,
  sendPlanUpdateEmail,
  sendPlanCancellationEmail 
} from '@/lib/email';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch user details from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!dbUser.email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'account';
    const name = dbUser.firstName ? `${dbUser.firstName} ${dbUser.lastName || ''}`.trim() : 'User';

    let result;
    switch (type) {
      case 'account':
        result = await sendAccountCreationEmail({
          name,
          email: dbUser.email
        });
        break;
      case 'plan-update':
        result = await sendPlanUpdateEmail({
          name,
          email: dbUser.email,
          planName: 'Premium Plan',
          amount: 99.99,
          currency: 'RON'
        });
        break;
      case 'plan-cancellation':
        result = await sendPlanCancellationEmail({
          name,
          email: dbUser.email,
          planName: 'Premium Plan',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      message: `Email sent successfully: ${type}`,
      userDetails: {
        email: dbUser.email,
        name: name
      },
      type,
      result
    });

  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 });
  }
} 