import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeResponse } from '@/order';

export async function GET(req: Request) {
  try {
    console.log('Received GET return from Netopia');
    
    // Get the orderId from the URL
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    
    if (!orderId) {
      console.error('No orderId provided in return URL');
      return NextResponse.redirect(new URL('/subscriptions?error=missing_order', req.url));
    }

    // Always redirect to verification page with orderId
    return NextResponse.redirect(new URL(`/payment/verify?orderId=${orderId}`, req.url));
  } catch (error) {
    console.error('[NETOPIA_RETURN_GET_ERROR]', error);
    return NextResponse.redirect(new URL('/subscriptions?error=internal_error', req.url));
  }
}

export async function POST(req: Request) {
  try {
    console.log('Received POST return from Netopia');
    
    const formData = await req.formData();
    const envKey = formData.get('env_key');
    const data = formData.get('data');
    const iv = formData.get('iv');
    const cipher = formData.get('cipher');

    if (!envKey || !data || !iv || !cipher) {
      console.error('Missing required payment data');
      return NextResponse.redirect(new URL('/subscriptions?error=missing_data', req.url));
    }

    // Decode the response from Netopia
    const decodedResponse = await decodeResponse({
      env_key: envKey.toString(),
      data: data.toString(),
      iv: iv.toString(),
      cipher: cipher.toString()
    });

    console.log('Decoded return response:', decodedResponse);

    // Extract transaction information
    const { order } = decodedResponse;
    const { 
      $: { id: orderId }
    } = order;

    // Always redirect to verification page with orderId
    return NextResponse.redirect(new URL(`/payment/verify?orderId=${orderId}`, req.url));
  } catch (error) {
    console.error('[NETOPIA_RETURN_POST_ERROR]', error);
    return NextResponse.redirect(new URL('/subscriptions?error=internal_error', req.url));
  }
} 