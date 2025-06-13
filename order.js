'use strict';

const rc4 = require('./encrypt.js');
const xml2js = require('xml2js');

const privateKey = process.env.NETOPIA_PRIVATE_KEY;
const publicKey = process.env.NETOPIA_PUBLIC_KEY;
const signature = process.env.NETOPIA_POS_SIGNATURE;

module.exports = {
  getRequest: getRequest,
  decodeResponse: decodeResponse,
  decodeV2Response: decodeV2Response
};

// Legacy v1.x functions - kept for backwards compatibility
function getRequest(paymentData) {
  // ... existing code for v1 ...
}

function decodeResponse(env_key, data) {
  // ... existing code for v1 ...
}

// New v2.x functions
function decodeV2Response(data) {
  try {
    // Validate required fields
    if (!data || !data.order || !data.payment) {
      throw new Error('Missing required fields in IPN data');
    }

    const { order, payment } = data;

    // Map Netopia v2 status codes to our internal status
    const statusMap = {
      1: 'PENDING',   // Pending
      2: 'PENDING',   // In progress
      3: 'PAID',      // Paid
      4: 'SCHEDULED', // Scheduled
      5: 'CONFIRMED', // Confirmed
      6: 'PENDING',   // Pending authorization
      7: 'CANCELED',  // Canceled
      8: 'PENDING',   // Pending
      9: 'ERROR',     // Error
      10: 'DECLINED', // Declined
      11: 'PENDING',  // Pending notification
      12: 'ERROR',    // Invalid account
      13: 'EXPIRED',  // Expired
      14: 'PENDING',  // In progress
      15: 'PENDING'   // 3DS required
    };

    // Map error codes to messages
    const errorMessages = {
      '00': 'Approved',
      '16': 'Card number incorrect',
      '51': 'Insufficient funds',
      '54': 'Card expired',
      '62': 'Restricted card',
      '65': 'Card activity limit exceeded',
      '68': 'Response received too late',
      '91': 'Issuer not available',
      '96': 'System malfunction'
    };

    return {
      ntpID: payment.ntpID,
      orderID: order.orderID,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      status: statusMap[payment.status] || 'ERROR',
      paymentMethod: 'card',
      maskedCard: payment.maskedCard,
      rrn: payment.data?.RRN,
      authCode: payment.data?.AuthCode,
      errorCode: payment.code,
      errorMessage: errorMessages[payment.code] || payment.message || 'Unknown error',
      // Extract recurring payment token
      token: payment.token || payment.binding?.token,
      tokenExpiryMonth: payment.binding?.expireMonth,
      tokenExpiryYear: payment.binding?.expireYear,
      raw: data
    };
  } catch (error) {
    console.error('[NETOPIA_V2] Error decoding IPN response:', error);
    throw error;
  }
} 