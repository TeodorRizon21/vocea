// Netopia Payment API v2.x Implementation
// Based on: https://doc.netopia-payments.com/docs/payment-api/v2.x/introduction

export interface NetopiaConfig {
  apiKey: string; // API Key from NETOPIA admin panel
  posSignature: string; // POS Signature from NETOPIA admin panel
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

// Request structure for v2.x API conform documentației oficiale
export interface StartRequest {
  config: {
    emailTemplate?: string;
    notifyUrl: string;
    redirectUrl: string;
    language: string;
  };
  payment: {
    options?: {
      installments?: number;
      bonus?: number;
    };
    instrument?: {
      type: string; // "card"
      account?: string; // Card number for direct payments
      expMonth?: number;
      expYear?: number;
      secretCode?: string; // CVV
      token?: string;
    };
    data?: {
      BROWSER_USER_AGENT?: string;
      OS?: string;
      OS_VERSION?: string;
      MOBILE?: string;
      SCREEN_POINT?: string;
      SCREEN_PRINT?: string;
      BROWSER_COLOR_DEPTH?: string;
      BROWSER_SCREEN_HEIGHT?: string;
      BROWSER_SCREEN_WIDTH?: string;
      BROWSER_PLUGINS?: string;
      BROWSER_JAVA_ENABLED?: string;
      BROWSER_LANGUAGE?: string;
      BROWSER_TZ?: string;
      BROWSER_TZ_OFFSET?: string;
      IP_ADDRESS?: string;
    };
  };
  order: {
    ntpID?: string;
    posSignature: string; // Required POS Signature
    dateTime: string; // Format: YYYY-MM-DDTHH:mm:ssZ
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
    data?: any;
  };
}

// Response structure conform documentației NETOPIA v2.x
export interface StartResponse {
  status: number;
  code: number;
  message: string;
  data?: {
    customerAction?: {
      authenticationToken?: string;
      formData?: {
        backUrl?: string;
        paReq?: string;
      };
      type?: string; // "Authentication3D"
      url?: string;
    };
    error?: {
      code: string; // Error codes like "100", "56", "99", etc.
      message: string;
    };
    payment?: {
      amount: number;
      currency: string;
      ntpID: string;
      status: number; // Status codes: 3=Paid, 5=Confirmed, 15=3DS required
    };
  };
}

// 3DS Authorization request structure
export interface VerifyAuthRequest {
  authenticationToken: string;
  ntpID: string;
  paRes: string; // Payment Authentication Response from bank
}

// 3DS Authorization response structure
export interface VerifyAuthResponse {
  status: number;
  code: number;
  message: string;
  data?: {
    error?: {
      code: string;
      message: string;
    };
    payment?: {
      amount: number;
      currency: string;
      ntpID: string;
      status: number; // 3=Paid, 5=Confirmed
      token?: string;
      data?: {
        AuthCode?: string;
        BIN?: string;
        ISSUER?: string;
        ISSUER_COUNTRY?: string;
        RRN?: string;
      };
    };
  };
}

export class NetopiaV2 {
  private config: NetopiaConfig;
  private apiUrl: string;

  constructor(config: NetopiaConfig) {
    this.config = config;
    // URL-uri corecte conform documentației oficiale NETOPIA v2.x
    this.apiUrl = config.isProduction 
      ? 'https://secure.mobilpay.ro/pay'  // Production URL corect din documentație
      : 'https://secure.sandbox.netopia-payments.com';  // Sandbox URL
    
    // Validare configurație la inițializare
    console.log('[NETOPIA_V2] Initializing with config:', {
      hasApiKey: !!config.apiKey,
      apiKeyLength: config.apiKey.length,
      hasPosSignature: !!config.posSignature,
      posSignatureLength: config.posSignature.length,
      isProduction: config.isProduction,
      selectedApiUrl: this.apiUrl
    });
  }

  async startPayment(request: Omit<StartRequest, 'order'> & {
    order: Omit<StartRequest['order'], 'dateTime' | 'posSignature'>;
  }): Promise<StartResponse> {
    // Add required fields per v2.x documentation
    const fullRequest: StartRequest = {
      ...request,
      order: {
        ...request.order,
        posSignature: this.config.posSignature, // Required per v2.x docs
        dateTime: new Date().toISOString() // ISO 8601 format required
      }
    };

    console.log('[NETOPIA_V2] Starting payment with request:', {
      orderID: fullRequest.order.orderID,
      amount: fullRequest.order.amount,
      currency: fullRequest.order.currency,
      posSignature: fullRequest.order.posSignature,
      redirectUrl: fullRequest.config.redirectUrl,
      notifyUrl: fullRequest.config.notifyUrl
    });

    // Debug logging for authentication issues
    console.log('[NETOPIA_V2] Authentication Debug:', {
      apiUrl: this.apiUrl,
      apiKeyLength: this.config.apiKey.length,
      apiKeyPrefix: this.config.apiKey.substring(0, 8) + '...',
      posSignatureLength: this.config.posSignature.length,
      posSignaturePrefix: this.config.posSignature.substring(0, 8) + '...',
      isProduction: this.config.isProduction
    });

    // Test validare API Key format
    console.log('[NETOPIA_V2] API Key Validation:', {
      startsWithCorrectPrefix: this.config.apiKey.startsWith('k'),
      containsUnderscore: this.config.apiKey.includes('_'),
      hasCorrectLength: this.config.apiKey.length === 60,
      posSignatureFormat: /^[A-Z0-9-]{24}$/.test(this.config.posSignature)
    });

    // Advanced API Key Debugging pentru identificarea problemelor de autentificare
    console.log('[NETOPIA_V2] Advanced API Key Debug:', {
      apiKeyFull: this.config.apiKey, // DEBUG ONLY - remove in production
      apiKeyBytes: Buffer.from(this.config.apiKey).length,
      apiKeyHex: Buffer.from(this.config.apiKey).toString('hex').substring(0, 40) + '...',
      hasInvalidChars: /[^a-zA-Z0-9_-]/.test(this.config.apiKey),
      apiKeyTrimmed: this.config.apiKey.trim() === this.config.apiKey,
      envVariableSet: !!process.env.NETOPIA_API_KEY,
      posSignatureFull: this.config.posSignature, // DEBUG ONLY - remove in production
      currentDateTime: new Date().toISOString(),
      requestTimestamp: Date.now()
    });

    // Validare configurație mediu
    console.log('[NETOPIA_V2] Environment Configuration:', {
      nodeEnv: process.env.NODE_ENV,
      sandboxUrl: 'https://secure.sandbox.netopia-payments.com',
      productionUrl: 'https://secure.mobilpay.ro/pay',
      currentApiUrl: this.apiUrl,
      isUsingSandbox: !this.config.isProduction,
      expectedSandboxDomain: this.apiUrl.includes('sandbox'),
      tlsRejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED
    });

    // Log cererea RAW care se trimite la API
    console.log('[NETOPIA_V2] RAW REQUEST TO API:', JSON.stringify(fullRequest, null, 2));

    // Log billing/shipping objects în detaliu
    console.log('[NETOPIA_V2] BILLING OBJECT DETAILED:', {
      email: fullRequest.order.billing.email,
      phone: fullRequest.order.billing.phone,
      firstName: fullRequest.order.billing.firstName,
      lastName: fullRequest.order.billing.lastName,
      city: fullRequest.order.billing.city,
      country: fullRequest.order.billing.country,
      state: fullRequest.order.billing.state,
      postalCode: fullRequest.order.billing.postalCode,
      details: fullRequest.order.billing.details,
      hasAllFields: !!(fullRequest.order.billing.email && fullRequest.order.billing.phone && 
                      fullRequest.order.billing.firstName && fullRequest.order.billing.lastName && 
                      fullRequest.order.billing.city && fullRequest.order.billing.country && 
                      fullRequest.order.billing.state && fullRequest.order.billing.postalCode && 
                      fullRequest.order.billing.details)
    });

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': this.config.apiKey // Direct API Key conform documentației NETOPIA v2.x
      };

      console.log('[NETOPIA_V2] Request Headers:', {
        'Content-Type': headers['Content-Type'],
        'Accept': headers['Accept'],
        'Authorization': headers['Authorization'].substring(0, 20) + '...'
      });

      console.log('[NETOPIA_V2] About to make fetch request to:', `${this.apiUrl}/payment/card/start`);
      console.log('[NETOPIA_V2] Fetch options:', {
        method: 'POST',
        headers: 'HEADERS_OBJECT',
        bodyLength: JSON.stringify(fullRequest).length
      });

      const response = await fetch(`${this.apiUrl}/payment/card/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify(fullRequest)
      });

      console.log('[NETOPIA_V2] Fetch completed! Response details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries([...response.headers.entries()]),
        url: response.url
      });

      console.log('[NETOPIA_V2] Response Status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NETOPIA_V2] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: `${this.apiUrl}/payment/card/start`,
          requestSample: {
            config: fullRequest.config,
            payment: {
              ...fullRequest.payment,
              data: Object.keys(fullRequest.payment.data || {})
            },
            order: {
              ...fullRequest.order,
              billing: 'BILLING_INFO_OBJECT',
              shipping: 'SHIPPING_INFO_OBJECT'
            }
          }
        });
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      const result: StartResponse = await response.json();
      
      console.log('[NETOPIA_V2] Payment response:', {
        status: result.status,
        code: result.code,
        message: result.message,
        hasCustomerAction: !!result.data?.customerAction,
        hasError: !!result.data?.error,
        errorCode: result.data?.error?.code,
        paymentStatus: result.data?.payment?.status
      });

      return result;
    } catch (error) {
      console.error('[NETOPIA_V2] Request failed:', error);
      throw error;
    }
  }

  /**
   * 3DS Authorization - Verify authentication after user completes bank verification
   * This is called after the bank redirects the user back with paRes
   * Ref: https://doc.netopia-payments.com/docs/payment-api/v2.x/authorize/authorize-intro
   */
  async verifyAuth(request: VerifyAuthRequest): Promise<VerifyAuthResponse> {
    console.log('[NETOPIA_V2] Verifying 3DS authentication:', {
      ntpID: request.ntpID,
      authenticationToken: request.authenticationToken.substring(0, 10) + '...',
      hasPaRes: !!request.paRes
    });

    try {
      const response = await fetch(`${this.apiUrl}/payment/card/verify-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.config.apiKey
        },
        body: JSON.stringify({
          authenticationToken: request.authenticationToken,
          ntpID: request.ntpID,
          formData: {
            paRes: request.paRes
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NETOPIA_V2] 3DS Verify Auth Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      const result: VerifyAuthResponse = await response.json();
      
      console.log('[NETOPIA_V2] 3DS Auth verification result:', {
        status: result.status,
        code: result.code,
        message: result.message,
        paymentStatus: result.data?.payment?.status,
        hasError: !!result.data?.error
      });

      return result;
    } catch (error) {
      console.error('[NETOPIA_V2] 3DS Auth verification failed:', error);
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
    language?: string;
  }): Promise<{ 
    redirectUrl?: string; 
    formData?: Record<string, string>; 
    authenticationToken?: string;
    ntpID?: string;
    requires3DS?: boolean;
    error?: any 
  }> {
    // Request structure EXACTĂ conform sample request din documentație
    const request: StartRequest = {
      config: {
        notifyUrl: orderDetails.notifyUrl,
        redirectUrl: orderDetails.redirectUrl,
        language: orderDetails.language || 'RO'
      },
      payment: {
        options: {
          installments: 1
        },
        instrument: {
          type: "card"
        },
        data: {
          // Browser data conform documentației pentru 3DS
          BROWSER_USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          OS: "Windows",
          OS_VERSION: "10",
          MOBILE: "false",
          BROWSER_COLOR_DEPTH: "24",
          BROWSER_SCREEN_WIDTH: "1920",
          BROWSER_SCREEN_HEIGHT: "1080",
          BROWSER_JAVA_ENABLED: "false",
          BROWSER_LANGUAGE: "ro-RO",
          BROWSER_TZ: "Europe/Bucharest",
          BROWSER_TZ_OFFSET: "+02:00",
          IP_ADDRESS: "127.0.0.1"
        }
      },
      order: {
        posSignature: this.config.posSignature,
        dateTime: new Date().toISOString(),
        description: orderDetails.description,
        orderID: orderDetails.orderID,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        billing: {
          ...orderDetails.billing,
          // Ensure all required fields are present
          country: orderDetails.billing.country || 642, // Romania by default
        },
        shipping: {
          ...orderDetails.billing, // Use billing as shipping for simplicity
          country: orderDetails.billing.country || 642
        },
        installments: {
          selected: 1,
          available: [1]
        }
      }
    };

    try {
      const response = await this.startPayment(request);
      
      // Handle response conform quick-start din documentație
      if (response.data?.error) {
        const errorCode = response.data.error.code;
        
        // Error code 100 + status 15 = 3DS required
        if (errorCode === "100" && response.data?.payment?.status === 15) {
          console.log('[NETOPIA_V2] 3DS authentication required for payment');
          return {
            redirectUrl: response.data.customerAction?.url,
            formData: response.data.customerAction?.formData || {},
            authenticationToken: response.data.customerAction?.authenticationToken,
            ntpID: response.data.payment?.ntpID,
            requires3DS: true
          };
        }
        
        // Other errors
        return {
          error: {
            code: errorCode,
            message: response.data.error.message
          }
        };
      }
      
      // Success cases - status 3 (Paid) or status 5 (Confirmed)
      if (response.data?.payment?.status === 3 || response.data?.payment?.status === 5) {
        console.log('[NETOPIA_V2] Payment completed successfully without 3DS');
        return {
          redirectUrl: orderDetails.redirectUrl,
          requires3DS: false
        };
      }
      
      // Payment pending 3DS (status 15)
      if (response.data?.payment?.status === 15 && response.data.customerAction) {
        console.log('[NETOPIA_V2] Payment pending 3DS authentication');
        return {
          redirectUrl: response.data.customerAction.url,
          formData: response.data.customerAction.formData || {},
          authenticationToken: response.data.customerAction.authenticationToken,
          ntpID: response.data.payment.ntpID,
          requires3DS: true
        };
      }
      
      // Unexpected response
      return {
        error: {
          code: "999",
          message: `Unexpected response format: status=${response.status}, paymentStatus=${response.data?.payment?.status}`
        }
      };
      
    } catch (error) {
      console.error('[NETOPIA_V2] Hosted payment creation failed:', error);
      return {
        error: {
          code: "999",
          message: error instanceof Error ? error.message : "Unknown error"
        }
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(orderID: string): Promise<any> {
    console.log('[NETOPIA_V2] Verifying payment for orderID:', orderID);
    
    try {
      const response = await fetch(`${this.apiUrl}/payment/card/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.config.apiKey
        },
        body: JSON.stringify({
          orderID: orderID,
          posSignature: this.config.posSignature
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[NETOPIA_V2] Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Test API connectivity and credentials
   * Useful for debugging authentication issues
   */
  async testConnection(): Promise<{
    sandbox: { success: boolean; error?: string; url: string };
    production: { success: boolean; error?: string; url: string };
    recommendations: string[];
  }> {
    const results = {
      sandbox: { success: false, error: '', url: 'https://secure.sandbox.netopia-payments.com' },
      production: { success: false, error: '', url: 'https://secure.mobilpay.ro/pay' },
      recommendations: [] as string[]
    };

    // Test sandbox
    try {
      const response = await fetch(`${results.sandbox.url}/payment/card/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.config.apiKey
        },
        body: JSON.stringify({
          config: { notifyUrl: 'https://test.com/ipn', redirectUrl: 'https://test.com/return', language: 'RO' },
          payment: { options: { installments: 1 }, instrument: { type: 'card' }, data: {} },
          order: {
            posSignature: this.config.posSignature,
            dateTime: new Date().toISOString(),
            description: 'Test',
            orderID: 'TEST_' + Date.now(),
            amount: 1,
            currency: 'RON',
            billing: { email: 'test@test.com', phone: '0700000000', firstName: 'Test', lastName: 'User', city: 'Bucharest', country: 642, state: 'Bucharest', postalCode: '010000', details: 'Test Address' },
            shipping: { email: 'test@test.com', phone: '0700000000', firstName: 'Test', lastName: 'User', city: 'Bucharest', country: 642, state: 'Bucharest', postalCode: '010000', details: 'Test Address' },
            installments: { selected: 1, available: [1] }
          }
        })
      });

      if (response.status === 401) {
        results.sandbox.error = 'Unauthorized - API Key invalid for sandbox';
      } else if (response.status === 200) {
        results.sandbox.success = true;
      } else {
        const errorText = await response.text();
        results.sandbox.error = `HTTP ${response.status}: ${errorText}`;
      }
    } catch (error) {
      results.sandbox.error = error instanceof Error ? error.message : 'Network error';
    }

    // Test production (only if sandbox fails with 401)
    if (!results.sandbox.success && results.sandbox.error?.includes('Unauthorized')) {
      try {
        const response = await fetch(`${results.production.url}/payment/card/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': this.config.apiKey
          },
          body: JSON.stringify({
            config: { notifyUrl: 'https://test.com/ipn', redirectUrl: 'https://test.com/return', language: 'RO' },
            payment: { options: { installments: 1 }, instrument: { type: 'card' }, data: {} },
            order: {
              posSignature: this.config.posSignature,
              dateTime: new Date().toISOString(),
              description: 'Test',
              orderID: 'TEST_' + Date.now(),
              amount: 1,
              currency: 'RON',
              billing: { email: 'test@test.com', phone: '0700000000', firstName: 'Test', lastName: 'User', city: 'Bucharest', country: 642, state: 'Bucharest', postalCode: '010000', details: 'Test Address' },
              shipping: { email: 'test@test.com', phone: '0700000000', firstName: 'Test', lastName: 'User', city: 'Bucharest', country: 642, state: 'Bucharest', postalCode: '010000', details: 'Test Address' },
              installments: { selected: 1, available: [1] }
            }
          })
        });

        if (response.status === 401) {
          results.production.error = 'Unauthorized - API Key invalid for production';
        } else if (response.status === 200) {
          results.production.success = true;
        } else {
          const errorText = await response.text();
          results.production.error = `HTTP ${response.status}: ${errorText}`;
        }
      } catch (error) {
        results.production.error = error instanceof Error ? error.message : 'Network error';
      }
    }

    // Generate recommendations
    if (!results.sandbox.success && !results.production.success) {
      results.recommendations.push('API Key pare să nu fie valid pentru niciun environment');
      results.recommendations.push('Verifică că API Key-ul este copiat corect din panoul NETOPIA');
      results.recommendations.push('Asigură-te că contul NETOPIA este activ și verificat');
    } else if (results.production.success && !results.sandbox.success) {
      results.recommendations.push('API Key-ul pare să fie pentru PRODUCTION, nu pentru SANDBOX');
      results.recommendations.push('Folosește isProduction: true în configurația NetopiaV2');
    } else if (results.sandbox.success && !results.production.success) {
      results.recommendations.push('API Key-ul pare să fie pentru SANDBOX, nu pentru PRODUCTION');
      results.recommendations.push('Folosește isProduction: false în configurația NetopiaV2');
    }

    return results;
  }
}

// Helper functions
export function getRomaniaCountryCode(): number {
  return 642; // ISO 3166-1 numeric code for Romania
}

export function formatBillingInfo(billingData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city: string;
  postalCode?: string;
}): BillingInfo {
  return {
    email: billingData.email,
    phone: billingData.phone || "0700000000", // Default phone if not provided
    firstName: billingData.firstName,
    lastName: billingData.lastName,
    city: billingData.city,
    country: getRomaniaCountryCode(),
    state: billingData.city, // Use city as state for Romania
    postalCode: billingData.postalCode || "000000", // Default postal code
    details: billingData.address || `${billingData.city}, Romania` // Default address
  };
} 