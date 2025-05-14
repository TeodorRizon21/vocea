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

const getPayment = (orderId, amount, currency, billingInfo) => {
  if (!signature) {
    throw new Error('NETOPIA_SIGNATURE is not set in environment variables');
  }
  if (!returnUrl) {
    throw new Error('NETOPIA_RETURN_URL is not set in environment variables');
  }
  if (!confirmUrl) {
    throw new Error('NETOPIA_CONFIRM_URL is not set in environment variables');
  }

  console.log('Creating payment request with URLs:', {
    returnUrl,
    confirmUrl,
    ipnUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/mobilpay/ipn',
    appUrl: process.env.NEXT_PUBLIC_APP_URL
  });

  let date = new Date();
  const data = {
    order: {
      $: {
        id: orderId,
        timestamp: date.getTime(),
        type: 'card'
      },
      signature: signature,
      url: {
        return: `${process.env.NEXT_PUBLIC_APP_URL}/api/mobilpay/return`,
        confirm: `${process.env.NEXT_PUBLIC_APP_URL}/api/mobilpay/ipn`,
        ipn: `${process.env.NEXT_PUBLIC_APP_URL}/api/mobilpay/ipn`
      },
      invoice: {
        $: {
          currency: currency,
          amount: amount
        },
        details: 'Subscription payment',
        contact_info: {
          billing: {
            $: {
              type: 'person'
            },
            first_name: billingInfo.firstName,
            last_name: billingInfo.lastName,
            address: billingInfo.address,
            email: billingInfo.email,
            mobile_phone: billingInfo.phone
          },
          shipping: {
            $: {
              type: 'person'
            },
            first_name: billingInfo.firstName,
            last_name: billingInfo.lastName,
            address: billingInfo.address,
            email: billingInfo.email,
            mobile_phone: billingInfo.phone
          }
        }
      },
      params: {
        recurring: {
          expiration_date: (() => {
            // Set expiration date to 1 year from now
            const expDate = new Date();
            expDate.setFullYear(expDate.getFullYear() + 1);
            return expDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          })(),
          frequency: {
            days: 30 // Billing frequency in days (monthly)
          },
          auto: 'true' // Enable automatic recurring billing
        }
      },
      ipn_cipher: 'aes-256-cbc'
    }
  }
  return { data, algorithm: 'aes-256-cbc' };
}

function getRequest(orderId, amount = 1, billingInfo) {
  const result = getPayment(orderId, amount, 'RON', billingInfo)
  let xml = builder.buildObject(result.data);
  
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