import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    console.log('🧪 Testing welcome email...');
    
    const { email, firstName } = await req.json();
    
    if (!email || !firstName) {
      return NextResponse.json(
        { error: 'Email and firstName are required' },
        { status: 400 }
      );
    }

    console.log('📧 Sending test welcome email to:', email);
    
    const result = await sendWelcomeEmail({
      name: firstName,
      email: email,
    });

    console.log('📨 Email send result:', result);

    return NextResponse.json({ 
      success: true,
      message: 'Test email sent',
      result 
    });
  } catch (error) {
    console.error('❌ Error in test webhook:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
} 