import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const config = {
      ipnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mobilpay/ipn`,
      returnUrl: process.env.NETOPIA_RETURN_URL,
      confirmUrl: process.env.NETOPIA_CONFIRM_URL,
      hasPrivateKey: !!process.env.NETOPIA_PRIVATE_KEY,
      hasPublicKey: !!process.env.NETOPIA_PUBLIC_KEY,
      hasSignature: !!process.env.NETOPIA_SIGNATURE,
      environment: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    };

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