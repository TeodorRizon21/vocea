"use strict";
// Netopia Payment API v2.x Implementation
// Based on: https://doc.netopia-payments.com/docs/payment-api/v2.x/introduction
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetopiaV2 = void 0;
exports.getRomaniaCountryCode = getRomaniaCountryCode;
exports.formatBillingInfo = formatBillingInfo;
class NetopiaV2 {
    constructor(config) {
        this.config = config;
        // URL-uri corecte conform documentației oficiale NETOPIA v2.x
        // Allow forcing sandbox even in production for unapproved accounts
        const forceSandbox = process.env.NETOPIA_FORCE_SANDBOX === 'true';
        this.apiUrl = (config.isProduction && !forceSandbox)
            ? 'https://secure.mobilpay.ro/pay' // Production URL corect din documentație
            : 'https://secure.sandbox.netopia-payments.com'; // Sandbox URL
        // Validare configurație la inițializare
        console.log('[NETOPIA_V2] Initializing with config:', {
            hasApiKey: !!config.apiKey,
            apiKeyLength: config.apiKey.length,
            hasPosSignature: !!config.posSignature,
            posSignatureLength: config.posSignature.length,
            isProduction: config.isProduction,
            forceSandbox: forceSandbox,
            selectedApiUrl: this.apiUrl
        });
    }
    async startPayment(request) {
        var _a, _b;
        // Add required fields per v2.x documentation
        const fullRequest = Object.assign(Object.assign({}, request), { order: Object.assign(Object.assign({}, request.order), { posSignature: this.config.posSignature, dateTime: new Date().toISOString() // ISO 8601 format required
             }) });
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
            isUsingSandbox: this.apiUrl.includes('sandbox'),
            expectedSandboxDomain: this.apiUrl.includes('sandbox'),
            forceSandboxEnv: process.env.NETOPIA_FORCE_SANDBOX,
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
                        payment: Object.assign(Object.assign({}, fullRequest.payment), { data: Object.keys(fullRequest.payment.data || {}) }),
                        order: Object.assign(Object.assign({}, fullRequest.order), { billing: 'BILLING_INFO_OBJECT', shipping: 'SHIPPING_INFO_OBJECT' })
                    }
                });
                throw new Error(`HTTP Error ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            console.log('[NETOPIA_V2] Payment response:', {
                hasCustomerAction: !!result.customerAction,
                hasError: !!result.error,
                errorCode: (_a = result.error) === null || _a === void 0 ? void 0 : _a.code,
                paymentStatus: (_b = result.payment) === null || _b === void 0 ? void 0 : _b.status
            });
            return result;
        }
        catch (error) {
            console.error('[NETOPIA_V2] Request failed:', error);
            throw error;
        }
    }
    /**
     * 3DS Authorization - Verify authentication after user completes bank verification
     * This is called after the bank redirects the user back with paRes
     * Ref: https://doc.netopia-payments.com/docs/payment-api/v2.x/authorize/authorize-intro
     */
    async verifyAuth(request) {
        var _a, _b, _c;
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
            const result = await response.json();
            console.log('[NETOPIA_V2] 3DS Auth verification result:', {
                status: result.status,
                code: result.code,
                message: result.message,
                paymentStatus: (_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a.payment) === null || _b === void 0 ? void 0 : _b.status,
                hasError: !!((_c = result.data) === null || _c === void 0 ? void 0 : _c.error)
            });
            return result;
        }
        catch (error) {
            console.error('[NETOPIA_V2] 3DS Auth verification failed:', error);
            throw error;
        }
    }
    /**
     * Creates a payment request for hosted payment page
     * This is for cases where you don't have card details and want Netopia to handle the payment form
     */
    async createHostedPayment(orderDetails) {
        var _a, _b;
        const COUNTRY_CODES = {
            'Romania': 642,
            'RO': 642
        };
        // Request structure EXACTĂ conform sample request din documentație
        const request = {
            config: {
                notifyUrl: orderDetails.notifyUrl,
                redirectUrl: orderDetails.redirectUrl,
                language: orderDetails.language || 'ro'
            },
            payment: {
                options: {
                    installments: 1
                },
                instrument: {
                    type: 'card'
                },
                data: {
                    BROWSER_USER_AGENT: typeof window !== 'undefined' ? window.navigator.userAgent.split(' (')[0] : 'Node.js',
                    OS: 'Windows',
                    OS_VERSION: '10',
                    MOBILE: 'false',
                    BROWSER_COLOR_DEPTH: '24',
                    BROWSER_SCREEN_WIDTH: '1920',
                    BROWSER_SCREEN_HEIGHT: '1080',
                    BROWSER_JAVA_ENABLED: 'false',
                    BROWSER_LANGUAGE: 'ro-RO',
                    BROWSER_TZ: 'Europe/Bucharest',
                    BROWSER_TZ_OFFSET: '+02:00',
                    IP_ADDRESS: '127.0.0.1'
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
                    email: orderDetails.billing.email,
                    phone: orderDetails.billing.phone,
                    firstName: orderDetails.billing.firstName,
                    lastName: orderDetails.billing.lastName,
                    city: orderDetails.billing.city,
                    country: COUNTRY_CODES[orderDetails.billing.country] || 642,
                    state: orderDetails.billing.city,
                    postalCode: orderDetails.billing.postalCode,
                    details: orderDetails.billing.address
                },
                shipping: {
                    email: orderDetails.billing.email,
                    phone: orderDetails.billing.phone,
                    firstName: orderDetails.billing.firstName,
                    lastName: orderDetails.billing.lastName,
                    city: orderDetails.billing.city,
                    country: COUNTRY_CODES[orderDetails.billing.country] || 642,
                    state: orderDetails.billing.city,
                    postalCode: orderDetails.billing.postalCode,
                    details: orderDetails.billing.address
                },
                installments: {
                    selected: 1,
                    available: [1]
                }
            }
        };
        console.log('[NETOPIA_V2] RAW REQUEST TO API:', JSON.stringify(request, null, 2));
        try {
            const response = await this.startPayment(request);
            console.log('[NETOPIA_V2] Full response:', response);
            // Extract payment URL from response
            const paymentUrl = (_a = response.payment) === null || _a === void 0 ? void 0 : _a.paymentURL;
            const ntpID = (_b = response.payment) === null || _b === void 0 ? void 0 : _b.ntpID;
            if (!paymentUrl) {
                throw new Error('No payment URL in response');
            }
            return {
                redirectUrl: paymentUrl,
                ntpID,
                requires3DS: false
            };
        }
        catch (error) {
            console.error('[NETOPIA_V2] Hosted payment creation failed:', error);
            throw error;
        }
    }
    /**
     * Verify payment status
     */
    async verifyPayment(orderID) {
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
        }
        catch (error) {
            console.error('[NETOPIA_V2] Payment verification failed:', error);
            throw error;
        }
    }
    /**
     * Test API connectivity and credentials
     * Useful for debugging authentication issues
     */
    async testConnection() {
        var _a;
        const results = {
            sandbox: { success: false, error: '', url: 'https://secure.sandbox.netopia-payments.com' },
            production: { success: false, error: '', url: 'https://secure.mobilpay.ro/pay' },
            recommendations: []
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
            }
            else if (response.status === 200) {
                results.sandbox.success = true;
            }
            else {
                const errorText = await response.text();
                results.sandbox.error = `HTTP ${response.status}: ${errorText}`;
            }
        }
        catch (error) {
            results.sandbox.error = error instanceof Error ? error.message : 'Network error';
        }
        // Test production (only if sandbox fails with 401)
        if (!results.sandbox.success && ((_a = results.sandbox.error) === null || _a === void 0 ? void 0 : _a.includes('Unauthorized'))) {
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
                }
                else if (response.status === 200) {
                    results.production.success = true;
                }
                else {
                    const errorText = await response.text();
                    results.production.error = `HTTP ${response.status}: ${errorText}`;
                }
            }
            catch (error) {
                results.production.error = error instanceof Error ? error.message : 'Network error';
            }
        }
        // Generate recommendations
        if (!results.sandbox.success && !results.production.success) {
            results.recommendations.push('API Key pare să nu fie valid pentru niciun environment');
            results.recommendations.push('Verifică că API Key-ul este copiat corect din panoul NETOPIA');
            results.recommendations.push('Asigură-te că contul NETOPIA este activ și verificat');
        }
        else if (results.production.success && !results.sandbox.success) {
            results.recommendations.push('API Key-ul pare să fie pentru PRODUCTION, nu pentru SANDBOX');
            results.recommendations.push('Folosește isProduction: true în configurația NetopiaV2');
        }
        else if (results.sandbox.success && !results.production.success) {
            results.recommendations.push('API Key-ul pare să fie pentru SANDBOX, nu pentru PRODUCTION');
            results.recommendations.push('Folosește isProduction: false în configurația NetopiaV2');
        }
        return results;
    }
    /**
     * Create a recurring payment using a saved token
     * This enables automatic recurring payments without user interaction
     */
    async createRecurringPayment(orderDetails) {
        var _a, _b, _c;
        console.log('[NETOPIA_V2] Creating recurring payment with token:', {
            orderID: orderDetails.orderID,
            amount: orderDetails.amount,
            token: orderDetails.token.substring(0, 10) + '...' // Log only first 10 chars for security
        });
        const COUNTRY_CODES = {
            'Romania': 642,
            'RO': 642
        };
        try {
            const response = await fetch(`${this.apiUrl}/payment/card/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': this.config.apiKey
                },
                body: JSON.stringify({
                    config: {
                        notifyUrl: orderDetails.notifyUrl,
                        redirectUrl: orderDetails.notifyUrl.replace('/ipn', '/return'),
                        language: 'ro'
                    },
                    payment: {
                        token: orderDetails.token,
                        options: {
                            installments: 1
                        },
                        instrument: {
                            type: 'card'
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
                            email: orderDetails.billing.email,
                            phone: orderDetails.billing.phone,
                            firstName: orderDetails.billing.firstName,
                            lastName: orderDetails.billing.lastName,
                            city: orderDetails.billing.city,
                            country: COUNTRY_CODES[orderDetails.billing.country] || 642,
                            state: orderDetails.billing.city,
                            postalCode: orderDetails.billing.postalCode,
                            details: orderDetails.billing.address
                        },
                        shipping: {
                            email: orderDetails.billing.email,
                            phone: orderDetails.billing.phone,
                            firstName: orderDetails.billing.firstName,
                            lastName: orderDetails.billing.lastName,
                            city: orderDetails.billing.city,
                            country: COUNTRY_CODES[orderDetails.billing.country] || 642,
                            state: orderDetails.billing.city,
                            postalCode: orderDetails.billing.postalCode,
                            details: orderDetails.billing.address
                        }
                    }
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[NETOPIA_V2] Recurring payment failed - HTTP error:', response.status, errorText);
                throw new Error(`HTTP Error ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            console.log('[NETOPIA_V2] Recurring payment response:', result);
            // Check if payment was successful or in progress
            // Status 1 = Pending/In Progress (valid for recurring payments)
            // Status 3 = Paid, Status 5 = Confirmed
            if (((_a = result.payment) === null || _a === void 0 ? void 0 : _a.status) === 1 || ((_b = result.payment) === null || _b === void 0 ? void 0 : _b.status) === 3 || ((_c = result.payment) === null || _c === void 0 ? void 0 : _c.status) === 5) {
                return {
                    success: true,
                    ntpID: result.payment.ntpID,
                    status: result.payment.status,
                    paymentURL: result.payment.paymentURL
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Payment failed',
                    status: (_d = result.payment) === null || _d === void 0 ? void 0 : _d.status
                };
            }
        }
        catch (error) {
            console.error('[NETOPIA_V2] Recurring payment creation failed:', error);
            return {
                success: false,
                error: error
            };
        }
    }
}
exports.NetopiaV2 = NetopiaV2;
// Helper functions
function getRomaniaCountryCode() {
    return 642; // ISO 3166-1 numeric code for Romania
}
function formatBillingInfo(billingData) {
    // Create a more complete address format
    const fullAddress = billingData.address || `Str. Exemplu nr. 1, ${billingData.city}, Romania`;
    return {
        email: billingData.email,
        phone: billingData.phone || "0700000000", // Default phone if not provided
        firstName: billingData.firstName,
        lastName: billingData.lastName,
        city: billingData.city,
        country: getRomaniaCountryCode().toString(),
        state: billingData.city, // Default state to city name for Romania
        postalCode: billingData.postalCode || "010000", // Default postal code for Romania
        details: fullAddress, // Complete address for display
        address: fullAddress // Complete address for display
    };
}
