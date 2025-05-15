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

const getPayment = (orderId, amount, currency, billingInfo, urlConfig) => {
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
  let data = {
    order: {
      $: {
        id: orderId,
        timestamp: date.getTime(),
        type: 'card'
      },
      signature: signature,
      url: {
        return: urls.returnUrl,
        confirm: urls.confirmUrl,
        ipn: urls.ipnUrl
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
          expiration_date: new Date(date.setFullYear(date.getFullYear() + 1)).toISOString().split('T')[0],
          frequency: {
            days: 30
          },
          auto: true
        }
      },
      ipn_cipher: 'aes-256-cbc'
    }
  };

  return { data, algorithm: 'aes-256-cbc' };
}

function getRequest(orderId, amount = 1, billingInfo, urlConfig) {
  const result = getPayment(orderId, amount, 'RON', billingInfo, urlConfig)
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