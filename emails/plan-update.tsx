import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PlanUpdateEmailProps {
  name: string;
  planName: string;
  amount: number;
  currency: string;
}

export const PlanUpdateEmail = ({
  name,
  planName,
  amount,
  currency,
}: PlanUpdateEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Confirmare actualizare plan Vocea Campusului</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Confirmare Actualizare Plan</Heading>
          <Text style={text}>Bună {name},</Text>
          <Text style={text}>
            Planul tău Vocea Campusului a fost actualizat cu succes la {planName}.
          </Text>
          <Text style={text}>Detalii despre actualizarea planului tău:</Text>
          <Text style={text}>
            • Plan: {planName}<br />
            • Sumă: {amount} {currency}
          </Text>
          <Text style={text}>
            Îți mulțumim pentru suportul continuu!
          </Text>
          <Text style={text}>
            Cu stimă,<br />
            Echipa Vocea Campusului
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#2563eb',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

export default PlanUpdateEmail; 