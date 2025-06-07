// Netopia Payment API v2.x Implementation
// Based on: https://doc.netopia-payments.com/docs/payment-api/v2.x/start/start-payment

export interface NetopiaConfig {
  posSignature: string;
  isProduction?: boolean;
}

export interface BillingInfo {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  city: string;
  country: number; // Numeric ISO 3166-1 code (e.g., 642 for Romania)
  state: string;
  postalCode: string;
  details: string;
}

export interface Product {
  name: string;
  code: string;
  category: string;
  price: number;
  vat: number;
}

export interface StartRequest {
  config: {
    emailTemplate?: string;
    emailSubject?: string;
    cancelUrl?: string;
    notifyUrl: string;
    redirectUrl: string;
    language: string;
  };
  payment: {
    options?: {
      installments?: number;
      bonus?: number;
    };
    instrument: {
      type: string; // "card"
      account: string; // Card number
      expMonth: number;
      expYear: number;
      secretCode: string; // CVV
      token?: string;
    };
    data?: {
      [key: string]: string; // Browser/device data for 3DS
    };
  };
  order: {
    ntpID?: string;
    posSignature: string;
    dateTime: string; // ISO 8601 format
    description: string;
    orderID: string;
    amount: number;
    currency: string;
    billing: BillingInfo;
    shipping: BillingInfo;
    products?: Product[];
    installments?: {
      selected: number;
      available: number[];
    };
    data?: {
      property1?: string;
      property2?: string;
    };
  };
}

export interface StartResponse {
  status: number;
  message: string;
  error?: {
    code: string;
    message: string;
  };
  customerAction?: {
    formData: {
      [key: string]: string;
    };
    formUrl: string;
    httpMethod: string;
  };
  payment?: {
    ntpID: string;
    orderID: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    maskedCard?: string;
    rrn?: string;
    authCode?: string;
  };
}

export class NetopiaV2 {
  private config: NetopiaConfig;
  private apiUrl: string;

  constructor(config: NetopiaConfig) {
    this.config = config;
    this.apiUrl = config.isProduction 
      ? 'https://secure.mobilpay.ro/pay'
      : 'https://secure.sandbox.netopia-payments.com';
  }

  async startPayment(request: Omit<StartRequest, 'order'> & {
    order: Omit<StartRequest['order'], 'posSignature' | 'dateTime'>;
  }): Promise<StartResponse> {
    // Add required fields
    const fullRequest: StartRequest = {
      ...request,
      order: {
        ...request.order,
        posSignature: this.config.posSignature,
        dateTime: new Date().toISOString()
      }
    };

    console.log('[NETOPIA_V2] Starting payment with request:', {
      orderID: fullRequest.order.orderID,
      amount: fullRequest.order.amount,
      currency: fullRequest.order.currency,
      redirectUrl: fullRequest.config.redirectUrl,
      notifyUrl: fullRequest.config.notifyUrl
    });

    try {
      const response = await fetch(`${this.apiUrl}/payment/card/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fullRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NETOPIA_V2] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      const result: StartResponse = await response.json();
      
      console.log('[NETOPIA_V2] Payment response:', {
        status: result.status,
        message: result.message,
        hasCustomerAction: !!result.customerAction,
        hasError: !!result.error
      });

      return result;
    } catch (error) {
      console.error('[NETOPIA_V2] Request failed:', error);
      throw error;
    }
  }

  /**
   * Creates a payment request for hosted payment page
   * This is for cases where you don't have card details and want Netopia to handle the payment form
   */
  async createHostedPayment(orderDetails: {
    orderID: string;
    amount: number;
    currency: string;
    description: string;
    billing: BillingInfo;
    redirectUrl: string;
    notifyUrl: string;
    cancelUrl?: string;
    language?: string;
  }): Promise<{ redirectUrl: string; formData: Record<string, string> }> {
    const request: Omit<StartRequest, 'payment'> = {
      config: {
        notifyUrl: orderDetails.notifyUrl,
        redirectUrl: orderDetails.redirectUrl,
        cancelUrl: orderDetails.cancelUrl,
        language: orderDetails.language || 'ro'
      },
      order: {
        posSignature: this.config.posSignature,
        dateTime: new Date().toISOString(),
        description: orderDetails.description,
        orderID: orderDetails.orderID,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        billing: orderDetails.billing,
        shipping: orderDetails.billing // Use same for shipping
      }
    };

    // For hosted payments, we don't include payment.instrument
    // Instead, Netopia will show a payment form
    const hostedRequest = {
      ...request,
      payment: {
        options: {},
        data: {} // We'll add browser data here in the frontend
      }
    };

    try {
      const response = await fetch(`${this.apiUrl}/payment/card/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(hostedRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      const result: StartResponse = await response.json();

      if (result.customerAction) {
        return {
          redirectUrl: result.customerAction.formUrl,
          formData: result.customerAction.formData
        };
      } else {
        throw new Error('No customer action received from Netopia');
      }
    } catch (error) {
      console.error('[NETOPIA_V2] Hosted payment failed:', error);
      throw error;
    }
  }
}

// Helper function to get country code for Romania
export function getRomaniaCountryCode(): number {
  return 642; // ISO 3166-1 numeric code for Romania
}

// Helper function to format billing info
export function formatBillingInfo(billingData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}): BillingInfo {
  return {
    email: billingData.email,
    phone: billingData.phone,
    firstName: billingData.firstName,
    lastName: billingData.lastName,
    city: billingData.city,
    country: getRomaniaCountryCode(),
    state: billingData.city, // Use city as state for Romania
    postalCode: billingData.postalCode,
    details: billingData.address
  };
} 