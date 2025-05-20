import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
  Tailwind,
  Section,
} from '@react-email/components';
import * as React from 'react';

interface ContactFormEmailProps {
  name: string;
  email: string;
  contactType: string;
  subject: string;
  message: string;
}

export const ContactFormEmail = ({
  name,
  email,
  contactType,
  subject,
  message,
}: ContactFormEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Mesaj nou de la {name} prin formularul de contact</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded-lg my-[40px] mx-auto p-[20px] w-full max-w-[620px]">
            {/* Header */}
            <Section className="bg-gradient-to-r from-purple-600 to-indigo-600 mt-[-20px] ml-[-20px] mr-[-20px] p-8 rounded-t-lg">
              <Heading className="text-white text-[24px] font-bold text-center m-0">
                Mesaj Nou prin Formularul de Contact
              </Heading>
            </Section>

            <Section className="mt-8">
              <Text className="text-gray-600 text-[16px] leading-[24px]">
                Ai primit un nou mesaj prin formularul de contact al Vocea Campusului:
              </Text>
            </Section>

            {/* Sender Info */}
            <Section className="bg-gray-50 rounded-lg p-6 mt-4">
              <Text className="text-gray-800 text-[15px] leading-[24px] m-0">
                <strong className="text-purple-600">Nume:</strong> {name}
              </Text>
              <Text className="text-gray-800 text-[15px] leading-[24px] m-0 mt-2">
                <strong className="text-purple-600">Email:</strong> {email}
              </Text>
              <Text className="text-gray-800 text-[15px] leading-[24px] m-0 mt-2">
                <strong className="text-purple-600">Tip Contact:</strong> {contactType}
              </Text>
              <Text className="text-gray-800 text-[15px] leading-[24px] m-0 mt-2">
                <strong className="text-purple-600">Subiect:</strong> {subject}
              </Text>
            </Section>

            {/* Message Content */}
            <Section className="mt-8">
              <Text className="text-gray-800 text-[15px] leading-[24px] font-medium">
                Mesaj:
              </Text>
              <Text className="text-gray-600 text-[15px] leading-[24px] bg-gray-50 p-4 rounded-lg mt-2 whitespace-pre-wrap">
                {message}
              </Text>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[24px] mx-0 w-full" />

            {/* Footer */}
            <Section className="mt-8">
              <Text className="text-gray-500 text-[14px] leading-[24px] text-center">
                Acest email a fost trimis automat prin formularul de contact al platformei Vocea Campusului.
              </Text>
              <Text className="text-purple-600 text-[14px] leading-[24px] text-center mt-2">
                © {new Date().getFullYear()} Vocea Campusului. Toate drepturile rezervate.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}; 