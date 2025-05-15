import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const config = {
      ipnUrl: `${baseUrl}/api/mobilpay/ipn`,
      returnUrl: process.env.NETOPIA_RETURN_URL || `${baseUrl}/api/mobilpay/return`,
      confirmUrl: process.env.NETOPIA_CONFIRM_URL || `${baseUrl}/api/mobilpay/ipn`,
      hasPrivateKey: !!process.env.NETOPIA_PRIVATE_KEY,
      hasPublicKey: !!process.env.NETOPIA_PUBLIC_KEY,
      hasSignature: !!process.env.NETOPIA_SIGNATURE,
      environment: process.env.NODE_ENV,
      appUrl: baseUrl
    };

    console.log('Debug configuration:', config);

    return NextResponse.json({
      success: true,
      message: 'IPN Configuration Debug Info',
      config
    });
  } catch (error) {
    console.error('[IPN_DEBUG_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 