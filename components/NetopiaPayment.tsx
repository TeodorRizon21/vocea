"use client";

import { useEffect } from 'react';
import Script from 'next/script';

interface NetopiaPaymentProps {
  paymentUrl: string;
}

export default function NetopiaPayment({ paymentUrl }: NetopiaPaymentProps) {
  useEffect(() => {
    // Redirect to the payment URL
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  }, [paymentUrl]);

  return null; // We don't need to render anything since we're redirecting
} 