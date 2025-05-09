import crypto from 'crypto';
import forge from 'node-forge';
import { create } from 'xmlbuilder2';

const NETOPIA_SIGNATURE = '2WDB-4K4X-VHSY-QDT8-7GYE';
const NETOPIA_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIICeAIBADANBgkqhkiG9w0BAQEFAASCAmIwggJeAgEAAoGBAPWF5TRG+VH3kcWa
cheCdCB/EwUZYFELepVGldTsDIt/w7h9Bi/55+Eq0HjBp9zqMrz90jZh67akEQKb
x1ilA87XkrBKXTvGzyszglz6UbfLhuLg1UfmjJst9cOtwPOAdL30wNewKHv2uJio
wqqolt+OImKm0MO0/+MM/z8n4szPAgMBAAECgYEA8JL6O3cv5TkIBO+Iy7BvyUe6
g0ySK9drjclUFwYUZLwUMzmOToQ4yVECZNCcgsKYZMbwq4jXRmcMo9mwQxOt3Zvc
ukwcwbnhDbUY2pgEr+SMasYzEErg+pJLhLkWCs8tJL+YppV30+i9JT9LelekBwY3
bQmWdbaLv56P+5w7QIECQQD7SmicemdHGwmhEz13nbOynmP0h5nXY3yFYYkKmUSn
R6VpunCD9G3thIBJfFVyg4EDHqOQIMekypTcd8XRAmHJAkEA+h/Q4Hia8EXJA6hf
ATkaasI6R79ZriOUpa82wo7W2jqSGQ1UtujY3n7TuNuE0GjISgYwbhcowabJKEVJ
5gvF1wJAVjYM9cI4tHheMVi8edEs2Vbly/rJmM+U5N21emFi4FEAOumvuFWfcSFI
Me3qEsNy+3MDgmr8k1i9AXZF85LxoQJBALRifaFlWVgu++lHZDzdkc+sg5t6xJJx
1qIm2rc1jH2WAAdRNeczxjOwA8Etj3s+FjRMgmDjEuGWBzyju8fMdcECQQCj/DtM
+b7wtPqMtet6cbf8Mc45vJnvmIpviG/BMYi8dlQFty1gzw/dyn4CLNM47umAVxTR
9JSX2ToP3Qt102qK
-----END PRIVATE KEY-----`;

const NETOPIA_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIC3zCCAkigAwIBAgIBATANBgkqhkiG9w0BAQsFADCBiDELMAkGA1UEBhMCUk8x
EjAQBgNVBAgTCUJ1Y2hhcmVzdDESMBAGA1UEBxMJQnVjaGFyZXN0MRAwDgYDVQQK
EwdORVRPUElBMSEwHwYDVQQLExhORVRPUElBIERldmVsb3BtZW50IHRlYW0xHDAa
BgNVBAMTE25ldG9waWEtcGF5bWVudHMucm8wHhcNMjUwNDI1MDcyNzU0WhcNMzUw
NDIzMDcyNzU0WjCBiDELMAkGA1UEBhMCUk8xEjAQBgNVBAgTCUJ1Y2hhcmVzdDES
MBAGA1UEBxMJQnVjaGFyZXN0MRAwDgYDVQQKEwdORVRPUElBMSEwHwYDVQQLExhO
RVRPUElBIERldmVsb3BtZW50IHRlYW0xHDAaBgNVBAMTE25ldG9waWEtcGF5bWVu
dHMucm8wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBALwh0/NhEpZFuKvghZ9N
75CXba05MWNCh422kcfFKbqP5YViCUBg3Mc5ZYd1e0Xi9Ui1QI2Z/jvvchrDZGQw
jarApr3S9bowHEkZH81ZolOoPHBZbYpA28BIyHYRcaTXjLtiBGvjpwuzljmXeBoV
LinIaE0IUpMen9MLWG2fGMddAgMBAAGjVzBVMA4GA1UdDwEB/wQEAwIFoDATBgNV
HSUEDDAKBggrBgEFBQcDATAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBQ9yXCh
MGxzUzQflmkXT1oyIBoetTANBgkqhkiG9w0BAQsFAAOBgQBv2Ake9NW0XbZj8C44
HBKAFlgZi4K2APlMUGzSkqPo9k6r14N8MK3mQRPHDFhPyr3Ul0z8PAkdmTecBMFV
weu0rLouWB+1xoyJa09bIhEdLsGPvrgv2Q/oWBRqYZpjzrLrl/vJgy7tZaRbRDMl
3hvTJGxGs8RTdQuR3IDyLTio2w==
-----END CERTIFICATE-----`;

interface PaymentData {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerEmail: string;
  customerName: string;
}

export function generatePaymentUrl(data: PaymentData): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const envKey = 'test'; // Change to 'live' for production

  // Create the payment data object
  const paymentData = {
    env_key: envKey,
    data: {
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      details: data.description,
      customer_email: data.customerEmail,
      customer_name: data.customerName,
      timestamp: timestamp,
    },
  };

  // Convert to JSON and encode
  const jsonData = JSON.stringify(paymentData);
  const encodedData = Buffer.from(jsonData).toString('base64');

  // Create signature
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(encodedData);
  const signature = sign.sign(NETOPIA_PRIVATE_KEY, 'base64');

  // Construct the payment URL
  const paymentUrl = `https://sandboxsecure.mobilpay.ro/order/eu/do.php?env_key=${envKey}&data=${encodedData}&signature=${signature}`;

  return paymentUrl;
}

export function verifyPaymentResponse(data: string, signature: string): boolean {
  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    return verify.verify(NETOPIA_CERTIFICATE, signature, 'base64');
  } catch (error) {
    console.error('Error verifying payment response:', error);
    return false;
  }
}

export function generatePaymentFormFields({
  amount,
  currency,
  orderId,
  description,
  customerEmail,
  customerName,
  returnUrl,
  confirmUrl,
}: {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  confirmUrl: string;
}) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const [firstName, ...lastNameArr] = customerName.split(' ');
  const lastName = lastNameArr.join(' ') || '-';

  // 1. Build XML (without signature)
  const xmlObj = {
    order: {
      '@type': 'card',
      '@id': orderId,
      '@timestamp': timestamp,
      url: {
        return: returnUrl,
        confirm: confirmUrl,
      },
      invoice: {
        '@currency': currency,
        '@amount': amount.toFixed(2),
        details: description,
        contact_info: {
          billing: {
            type: 'person',
            first_name: firstName,
            last_name: lastName,
            email: customerEmail,
          },
        },
      },
    },
  };

  // 2. Convert to XML string (without signature)
  let xml = create({ version: '1.0', encoding: 'UTF-8' }, xmlObj).end({ prettyPrint: false });

  // 3. Sign the XML
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(xml);
  const signature = signer.sign(NETOPIA_PRIVATE_KEY, 'base64');

  // 4. Insert signature into XML (as last child of <order>)
  (xmlObj.order as any).signature = signature;
  xml = create({ version: '1.0', encoding: 'UTF-8' }, xmlObj).end({ prettyPrint: false });

  // 5. Generate session key and encrypt it with Netopia's public key
  const sessionKey = forge.random.getBytesSync(24);
  const publicKey = forge.pki.certificateFromPem(NETOPIA_CERTIFICATE).publicKey;
  const envKey = forge.util.encode64(
    (publicKey as forge.pki.rsa.PublicKey).encrypt(sessionKey, 'RSA-OAEP')
  );

  // 6. Encrypt XML with session key (3DES)
  const iv = forge.random.getBytesSync(8);
  const cipher = forge.cipher.createCipher('3DES-CBC', sessionKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(xml, 'utf8'));
  cipher.finish();
  const encrypted = cipher.output.getBytes();
  const data = forge.util.encode64(iv + encrypted);

  return {
    envKey,
    data,
    signature,
  };
}

export function generateNetopiaPaymentFields({
  orderId,
  amount,
  currency,
  description,
  billing,
  returnUrl,
  confirmUrl,
}: {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  billing: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    mobilePhone: string;
  };
  returnUrl: string;
  confirmUrl: string;
}) {
  // 1. Build the payment object as required by Netopia
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  const paymentObj = {
    order: {
      $: {
        id: orderId,
        timestamp,
        type: 'card',
      },
      signature: NETOPIA_SIGNATURE,
      url: {
        return: returnUrl,
        confirm: confirmUrl,
      },
      invoice: {
        $: {
          currency,
          amount: amount.toFixed(2),
        },
        details: description,
        contact_info: {
          billing: {
            $: {
              type: 'person',
            },
            first_name: billing.firstName,
            last_name: billing.lastName,
            address: billing.address,
            email: billing.email,
            mobile_phone: billing.mobilePhone,
          },
        },
      },
      ipn_cipher: 'aes-256-cbc',
    },
  };

  // 2. Convert to XML
  const xml = create({ version: '1.0', encoding: 'UTF-8' }, paymentObj).end({ prettyPrint: false });

  // 3. Generate a random session key (24 bytes for 3DES)
  const sessionKey = forge.random.getBytesSync(24);
  // 4. Encrypt the session key with Netopia's public key
  const publicKey = forge.pki.certificateFromPem(NETOPIA_CERTIFICATE).publicKey;
  const envKey = forge.util.encode64(
    (publicKey as forge.pki.rsa.PublicKey).encrypt(sessionKey, 'RSA-OAEP')
  );

  // 5. Encrypt the XML with the session key (3DES-CBC)
  const iv = forge.random.getBytesSync(8);
  const cipher = forge.cipher.createCipher('3DES-CBC', sessionKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(xml, 'utf8'));
  cipher.finish();
  const encrypted = cipher.output.getBytes();
  const data = forge.util.encode64(iv + encrypted);

  return { envKey, data };
} 