import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  console.log('[IPN_TEST] Test endpoint accessed:', {
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    success: true,
    message: 'IPN test endpoint is accessible',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  console.log('[IPN_TEST] Test endpoint accessed via POST');
  
  let body;
  try {
    const clone = req.clone();
    body = await clone.text();
  } catch (e) {
    body = 'Could not read body';
  }

  console.log('[IPN_TEST] Request details:', {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    body,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    success: true,
    message: 'IPN test endpoint POST received',
    timestamp: new Date().toISOString()
  });
} 