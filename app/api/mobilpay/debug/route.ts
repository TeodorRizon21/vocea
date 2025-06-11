import { NextResponse } from 'next/server';
import { NetopiaV2 } from '@/lib/netopia-v2';

export async function GET(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const config = {
      ipnUrl: `${baseUrl}/api/netopia/ipn`,
      returnUrl: process.env.NETOPIA_RETURN_URL || `${baseUrl}/api/netopia/return`,
      notifyUrl: process.env.NETOPIA_NOTIFY_URL || `${baseUrl}/api/netopia/ipn`,
      hasApiKey: !!process.env.NETOPIA_API_KEY,
      hasPublicKey: !!process.env.NETOPIA_PUBLIC_KEY,
      hasSignature: !!process.env.NETOPIA_SIGNATURE,
      hasPosSignature: !!process.env.NETOPIA_POS_SIGNATURE,
      environment: process.env.NODE_ENV,
      appUrl: baseUrl,
      version: 'v2.x'
    };

    // Debug detaliat pentru API Key și POS Signature
    const apiKeyDebug = process.env.NETOPIA_API_KEY ? {
      length: process.env.NETOPIA_API_KEY.length,
      prefix: process.env.NETOPIA_API_KEY.substring(0, 10) + '...',
      suffix: '...' + process.env.NETOPIA_API_KEY.substring(process.env.NETOPIA_API_KEY.length - 10),
      startsWithK: process.env.NETOPIA_API_KEY.startsWith('k'),
      containsUnderscore: process.env.NETOPIA_API_KEY.includes('_'),
      hasValidFormat: /^k[a-zA-Z0-9_-]{59}$/.test(process.env.NETOPIA_API_KEY),
      trimmed: process.env.NETOPIA_API_KEY.trim() === process.env.NETOPIA_API_KEY,
      hasSpecialChars: /[^a-zA-Z0-9_-]/.test(process.env.NETOPIA_API_KEY)
    } : null;

    const posSignatureDebug = process.env.NETOPIA_POS_SIGNATURE ? {
      length: process.env.NETOPIA_POS_SIGNATURE.length,
      value: process.env.NETOPIA_POS_SIGNATURE,
      hasValidFormat: /^[A-Z0-9-]{24}$/.test(process.env.NETOPIA_POS_SIGNATURE),
      parts: process.env.NETOPIA_POS_SIGNATURE.split('-').length,
      expectedParts: 5
    } : null;

    // Test de conectivitate pentru Netopia v2.x
    let connectivityTest: any = null;
    if (process.env.NETOPIA_API_KEY && process.env.NETOPIA_POS_SIGNATURE) {
      try {
        const netopia = new NetopiaV2({
          apiKey: process.env.NETOPIA_API_KEY,
          posSignature: process.env.NETOPIA_POS_SIGNATURE,
          isProduction: process.env.NODE_ENV === 'production'
        });

        // Încercare de verificare simplă (fără plată reală)
        connectivityTest = {
          clientCreated: true,
          apiUrl: process.env.NODE_ENV === 'production' 
            ? 'https://secure.mobilpay.ro/pay' 
            : 'https://secure.sandbox.netopia-payments.com',
          testAttempted: true,
          error: null,
          connectionResults: null
        };

        // Test connectivitate real
        console.log('[NETOPIA_V2_DEBUG] Starting connection test...');
        const connectionTest = await netopia.testConnection();
        connectivityTest.connectionResults = connectionTest;
        
      } catch (error) {
        connectivityTest = {
          clientCreated: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          testAttempted: false
        };
      }
    }

    console.log('Debug configuration (v2.x) detailed:', {
      ...config,
      apiKeyDebug,
      posSignatureDebug,
      connectivityTest
    });

    return NextResponse.json({
      success: true,
      message: 'NETOPIA v2.x Configuration Debug Info (Detailed)',
      config,
      apiKeyDebug,
      posSignatureDebug,
      connectivityTest,
      recommendations: {
        apiKeyIssues: apiKeyDebug && !apiKeyDebug.hasValidFormat ? [
          'API Key format invalid - should start with "k" and be 60 characters',
          'Check for extra spaces or invalid characters',
          'Regenerate API Key in NETOPIA admin panel'
        ] : [],
        posSignatureIssues: posSignatureDebug && !posSignatureDebug.hasValidFormat ? [
          'POS Signature format invalid - should be XXXX-XXXX-XXXX-XXXX-XXXX',
          'Should contain only uppercase letters, numbers and dashes',
          'Should have exactly 24 characters in 5 groups'
        ] : [],
        generalRecommendations: [
          'Verify API Key and POS Signature in NETOPIA admin panel -> Profile -> Security',
          'Ensure you are using the correct sandbox/production credentials',
          'Check if API Key has necessary permissions',
          'Verify that your account is active and verified'
        ]
      }
    });
  } catch (error) {
    console.error('[NETOPIA_V2_DEBUG_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 