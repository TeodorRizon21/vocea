import { decodeResponse } from '@/order';
import crypto from 'crypto';
import { OrderStatus } from '@prisma/client';

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

export interface NetopiaConfig {
  apiKey: string;
  returnUrl: string;
  confirmUrl: string;
  sandbox?: boolean;
}

export interface BillingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface RecurringDetails {
  initialOrderId?: string;
  interval: 'DAY' | 'MONTH' | 'YEAR';
  intervalCount: number;
  gracePeriod: number;
  automaticPayment: boolean;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  orderName?: string;
  orderDesc?: string;
  billing: BillingDetails;
  recurring?: RecurringDetails;
}

export interface PaymentResponse {
  status: string;
  orderId: string;
  amount: number;
  currency: string;
  errorCode: string;
  errorMessage: string;
  isRecurring: boolean;
  paymentDetails: {
    maskedCard: string;
    paymentMethod: string;
    rrn: string;
    authCode?: string;
  };
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
  
  // Consider a payment successful only if:
  // 1. Status is 'confirmed' or 'paid'
  // 2. AND error code is '0' (success)
  const isSuccessStatus = (status === 'confirmed' || status === 'paid');
  const isSuccess = isSuccessStatus && !isErrorCode;
  
  return {
    isValid: isSuccess,
    paymentStatus: isSuccess ? 'COMPLETED' : 'FAILED'
  };
}

export class Netopia {
  private config: NetopiaConfig;
  private apiUrl: string;

  constructor(config: NetopiaConfig) {
    this.config = config;
    this.apiUrl = process.env.NEXT_PUBLIC_NETOPIA_PAYMENT_URL || 
      (config.sandbox 
        ? 'https://sandboxsecure.mobilpay.ro'
        : 'https://secure.mobilpay.ro');
  }

  async startPayment(request: PaymentRequest): Promise<{ paymentUrl: string }> {
    const response = await fetch(`${this.apiUrl}/api/payment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
        orderName: request.orderName,
        orderDesc: request.orderDesc,
        billing: request.billing,
        recurring: request.recurring,
        returnUrl: this.config.returnUrl,
        confirmUrl: this.config.confirmUrl
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start payment');
    }

    return response.json();
  }

  async verifyPayment(orderId: string): Promise<PaymentResponse> {
    const response = await fetch(`${this.apiUrl}/api/payment/verify/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify payment');
    }

    return response.json();
  }

  async cancelRecurring(orderId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/recurring/cancel/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel recurring payment');
    }
  }
} 