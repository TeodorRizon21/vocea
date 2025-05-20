import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
  Tailwind
} from '@react-email/components';
import * as React from 'react';

interface PlanCancellationEmailProps {
  name: string;
  planName: string;
  endDate: string;
}

export const PlanCancellationEmail = ({
  name,
  planName,
  endDate,
}: PlanCancellationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Confirmare anulare plan Vocea Campusului</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-4">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[560px]">
            <Heading className="text-black text-[24px] font-semibold text-center p-0 my-[30px] mx-0">
              Confirmare Anulare Plan
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Bună {name},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Ne pare rău să te vedem plecând. Planul tău **{planName}** a fost anulat.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Planul tău va rămâne activ până la **{endDate}**.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Dacă te răzgândești, îți poți reactiva planul oricând.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Cu stimă,<br />
              Echipa Vocea Campusului
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[20px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Acest email a fost trimis de la Vocea Campusului.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PlanCancellationEmail; 