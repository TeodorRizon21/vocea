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

interface AccountCreationEmailProps {
  name: string;
}

export const AccountCreationEmail = ({
  name,
}: AccountCreationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bine ai venit la Vocea Campusului! Contul tău este gata</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bine ai venit la Vocea Campusului!</Heading>
          <Text style={text}>Bună {name},</Text>
          <Text style={text}>
            Îți mulțumim că ți-ai creat un cont pe Vocea Campusului. Suntem încântați să te avem alături!
          </Text>
          <Text style={text}>
            Contul tău a fost creat cu succes și este gata de utilizare.
          </Text>
          <Text style={text}>
            Dacă ai întrebări sau nevoie de asistență, nu ezita să contactezi echipa noastră de suport.
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

export default AccountCreationEmail; 