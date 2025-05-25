import { decodeResponse } from '@/order';

export interface IpnResponse {
  orderId: string;
  status: string;
  errorCode: string;
  errorMessage: string;
  amount: string;
  isRecurring: boolean;
  recurringDetails: any;
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
  const { 
    $: { id: orderId, timestamp },
    mobilpay: {
      action: status,
      original_amount: amount,
      error
    },
    params
  } = order;

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
    recurringDetails
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