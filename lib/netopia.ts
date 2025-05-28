import { decodeResponse } from '@/order';
import crypto from 'crypto';

export interface IpnResponse {
  orderId: string;
  status: string;
  errorCode: string;
  errorMessage: string;
  amount: string;
  isRecurring: boolean;
  recurringDetails: any;
  crc?: string;
}

export async function decodeIpnResponse(req: Request): Promise<IpnResponse> {
  // Parse form data
  const formData = await req.formData();
  const envKey = formData.get('env_key');
  const data = formData.get('data');
  const iv = formData.get('iv');
  const cipher = formData.get('cipher');

  if (!envKey || !data || !iv || !cipher) {
    throw new Error('Missing required payment data');
  }

  // Decode the response from Netopia
  const decodedResponse = await decodeResponse({
    env_key: envKey.toString(),
    data: data.toString(),
    iv: iv.toString(),
    cipher: cipher.toString()
  });

  // Extract transaction information
  const { order } = decodedResponse;
  
  // Handle both old and new response formats
  const orderId = order.$.id;
  const timestamp = order.$.timestamp;
  const status = order.mobilpay?.action || order.status;
  const amount = order.invoice.$.amount || order.mobilpay?.original_amount;
  const error = order.mobilpay?.error || order.error;
  const params = order.params;
  const crc = order.$.crc;

  // Verify CRC if present
  if (crc) {
    const calculatedCrc = crypto
      .createHash('md5')
      .update(`${orderId}${timestamp}${order.signature}${amount}`)
      .digest('hex');
    
    if (calculatedCrc !== crc) {
      console.error('CRC Mismatch', {
        received: crc,
        calculated: calculatedCrc,
        orderId,
        timestamp,
        amount
      });
      throw new Error('Invalid CRC');
    }
  }

  // Check if this is a recurring payment
  const isRecurring = !!(params && params.recurring);
  const recurringDetails = isRecurring ? params.recurring : null;

  return {
    orderId,
    status,
    errorCode: error?.$?.code || '',
    errorMessage: error?._ || '',
    amount,
    isRecurring,
    recurringDetails,
    crc
  };
}

export function validatePayment(status: string, errorCode: string) {
  // Error code '0' means success, any other code means failure
  const isErrorCode = errorCode && errorCode !== '0';
  const isSuccessStatus = status === 'confirmed' || status === 'paid';
  const paymentStatus = (!isErrorCode && isSuccessStatus) ? 'COMPLETED' : 'FAILED';

  return {
    isValid: !isErrorCode && isSuccessStatus,
    paymentStatus
  };
} 