import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Hr,
} from '@react-email/components';

interface PaymentFailedEmailProps {
  name: string;
  planName: string;
  amount: number;
  currency: string;
  nextAttemptDate?: string;
  retryUrl: string;
}

export default function PaymentFailedEmail({
  name,
  planName,
  amount,
  currency,
  nextAttemptDate,
  retryUrl,
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Text style={h1}>Vocea Campusului</Text>
          </Section>
          
          <Section style={section}>
            <Text style={h2}>Payment Failed</Text>
            <Text style={text}>Hello {name},</Text>
            <Text style={text}>
              We were unable to process your recurring payment for the {planName} plan ({amount} {currency}).
            </Text>

            <Section style={alertBox}>
              <Text style={alertText}>
                ⚠️ Your subscription benefits may be affected if the payment is not completed soon.
              </Text>
            </Section>

            {nextAttemptDate && (
              <Text style={text}>
                We will automatically attempt to charge your card again on {nextAttemptDate}.
              </Text>
            )}

            <Text style={text}>
              To ensure uninterrupted access to your subscription:
            </Text>
            
            <ul style={list}>
              <li>Verify that your card has sufficient funds</li>
              <li>Check if your card hasn't expired</li>
              <li>Ensure there are no restrictions on recurring payments</li>
            </ul>

            <Section style={buttonContainer}>
              <Button style={button} href={retryUrl}>
                Update Payment Method
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              If you need assistance, please contact our support team at{' '}
              <Link href="mailto:contact@voceacampusului.ro" style={link}>
                contact@voceacampusului.ro
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  padding: '10px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '5px',
  margin: '0 auto',
  padding: '20px',
  width: '100%',
  maxWidth: '600px',
};

const logo = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#6b46c1',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const section = {
  padding: '20px',
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 10px',
};

const alertBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeeba',
  borderRadius: '5px',
  margin: '20px 0',
  padding: '15px',
};

const alertText = {
  color: '#856404',
  fontSize: '16px',
  margin: '0',
};

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '10px 0 20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#6b46c1',
  borderRadius: '5px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none',
};

const hr = {
  borderColor: '#f0f0f0',
  margin: '20px 0',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  margin: '20px 0 0',
};

const link = {
  color: '#6b46c1',
  textDecoration: 'underline',
}; 