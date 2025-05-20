import { NextResponse } from 'next/server';
import { sendContactFormEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.contactType || !data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const result = await sendContactFormEmail({
      name: data.name,
      email: data.email,
      contactType: data.contactType === 'issue' ? 'Raportare Problemă' : 'Întrebare Generală',
      subject: data.subject,
      message: data.message,
    });

    if (!result.success) {
      console.error('[Contact API] Email sending failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact API] Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 