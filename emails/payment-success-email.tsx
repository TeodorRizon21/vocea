import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Link,
} from "@react-email/components";
import * as React from "react";

interface PaymentSuccessEmailProps {
  name: string;
  plan: string;
  amount: string;
  date: string;
}

export default function PaymentSuccessEmail({
  name,
  plan,
  amount,
  date,
}: PaymentSuccessEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Plata confirmată / Payment Confirmed - Vocea Campusului</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            {/* Romanian Version */}
            <Heading style={h1}>Plata confirmată!</Heading>
            
            <Text style={text}>
              Dragă {name},
            </Text>
            
            <Text style={text}>
              Mulțumim pentru abonamentul tău la Vocea Campusului! Plata ta a fost procesată cu succes.
            </Text>
            
            <Section style={detailsContainer}>
              <Text style={detailsText}>
                <strong>Plan:</strong> {plan}
              </Text>
              <Text style={detailsText}>
                <strong>Sumă plătită:</strong> {amount}
              </Text>
              <Text style={detailsText}>
                <strong>Data plății:</strong> {date}
              </Text>
            </Section>
            
            <Text style={text}>
              Acum ai acces la toate funcționalitățile premium ale platformei noastre. Poți începe să explorezi și să beneficiezi de toate avantajele abonamentului tău.
            </Text>
            
            <Section style={buttonContainer}>
              <Link href="https://voceacampusului.ro/dashboard" style={button}>
                Accesează Dashboard-ul
              </Link>
            </Section>
            
            <Text style={text}>
              Dacă ai întrebări despre abonamentul tău sau ai nevoie de asistență, echipa noastră este aici să te ajute.
            </Text>
            
            <Text style={text}>
              Cu stimă,<br />
              Echipa Vocea Campusului
            </Text>

            {/* Divider */}
            <Section style={divider} />

            {/* English Version */}
            <Heading style={h1}>Payment Confirmed!</Heading>
            
            <Text style={text}>
              Dear {name},
            </Text>
            
            <Text style={text}>
              Thank you for your subscription to Vocea Campusului! Your payment has been successfully processed.
            </Text>
            
            <Section style={detailsContainer}>
              <Text style={detailsText}>
                <strong>Plan:</strong> {plan}
              </Text>
              <Text style={detailsText}>
                <strong>Amount Paid:</strong> {amount}
              </Text>
              <Text style={detailsText}>
                <strong>Payment Date:</strong> {date}
              </Text>
            </Section>
            
            <Text style={text}>
              You now have access to all premium features of our platform. You can start exploring and benefiting from all the advantages of your subscription.
            </Text>
            
            <Section style={buttonContainer}>
              <Link href="https://voceacampusului.ro/dashboard" style={button}>
                Access Dashboard
              </Link>
            </Section>
            
            <Text style={text}>
              If you have any questions about your subscription or need assistance, our team is here to help.
            </Text>
            
            <Text style={text}>
              Best regards,<br />
              The Vocea Campusului Team
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Vocea Campusului. Toate drepturile rezervate / All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};

const content = {
  padding: "24px 48px",
};

const h1 = {
  color: "#6b46c1",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#4a5568",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const detailsContainer = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailsText = {
  color: "#4a5568",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#6b46c1",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const divider = {
  borderTop: "1px solid #e2e8f0",
  margin: "32px 0",
};

const footer = {
  padding: "24px 48px",
  borderTop: "1px solid #e2e8f0",
};

const footerText = {
  color: "#718096",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0",
}; 