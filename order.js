'use strict';

module.exports = {
  getRequest: getRequest,
  decodeResponse: decodeResponse
};

const rc4 = require('./encrypt.js');
const xml2js = require('xml2js');

const privateKey = process.env.NETOPIA_PRIVATE_KEY;
const publicKey = process.env.NETOPIA_PUBLIC_KEY;
const signature = process.env.NETOPIA_SIGNATURE;
const returnUrl = process.env.NETOPIA_RETURN_URL;
const confirmUrl = process.env.NETOPIA_CONFIRM_URL;

// Log environment variables for debugging
console.log('Netopia Configuration:', {
  hasSignature: !!signature,
  hasReturnUrl: !!returnUrl,
  hasConfirmUrl: !!confirmUrl,
  hasPublicKey: !!publicKey,
  hasPrivateKey: !!privateKey,
  signatureValue: signature
});

var builder = new xml2js.Builder({
  cdata: true,
  renderOpts: {
    pretty: true,
    indent: '  ',
    newline: '\n'
  }
});
var parser = new xml2js.Parser({
  explicitArray: false
});

const getPayment = (orderId, amount, currency, billingInfo, urlConfig, isRecurring = false) => {
  if (!signature) {
    throw new Error('NETOPIA_SIGNATURE is not set in environment variables');
  }

  // Use provided URL config or fallback to environment variables
  const urls = {
    returnUrl: urlConfig?.returnUrl || returnUrl,
    confirmUrl: urlConfig?.confirmUrl || confirmUrl,
    ipnUrl: urlConfig?.ipnUrl || process.env.NEXT_PUBLIC_APP_URL + '/api/mobilpay/ipn'
  };

  console.log('Creating payment request with URLs:', {
    ...urls,
    appUrl: process.env.NEXT_PUBLIC_APP_URL
  });

  let date = new Date();

  // Create the payment request XML
  const order = {
    order: {
      $: {
        id: orderId,
        timestamp: date.getTime(),
        type: 'card'
      },
      signature: signature,
      url: {
        return: urls.returnUrl,
        confirm: urls.confirmUrl
      },
      invoice: {
        currency: currency || 'RON',
        amount: amount,
        details: 'Payment for subscription'
      },
      params: {
        recurring: isRecurring ? {
          interval_day: '30',
          payments_no: '0' // Unlimited payments
        } : undefined
      },
      bill: {
        first_name: billingInfo.firstName,
        last_name: billingInfo.lastName,
        email: billingInfo.email,
        phone: billingInfo.phone,
        address: billingInfo.address
      }
    }
  };

  // Convert to XML
  const xml = builder.buildObject(order);
  
  return { data: xml, algorithm: 'aes-256-cbc' };
}

function getRequest(orderId, amount = 1, billingInfo, urlConfig) {
  const result = getPayment(orderId, amount, 'RON', billingInfo, urlConfig)
  let xml = result.data;
  
  // Log the XML for debugging
  console.log('Generated XML:', xml);

  return rc4.encrypt(publicKey, xml, result.algorithm);
}

function decodeResponse(data) {
  return new Promise(function (resolve, reject) {
    parser.parseString(rc4.decrypt(privateKey, data.iv, data.env_key, data.data, data.cipher), function (err, result) {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
} 