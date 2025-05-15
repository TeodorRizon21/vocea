"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PaymentVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = searchParams.get('orderId');
        
        if (!orderId) {
          console.error('No orderId provided');
          router.push('/subscriptions?error=missing_order');
          return;
        }

        // Add a small delay to ensure IPN has processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check payment status
        const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        // Redirect based on payment status
        if (data.status === 'COMPLETED') {
          router.push(`/payment/success?orderId=${orderId}`);
        } else if (data.status === 'FAILED') {
          router.push(`/payment/failed?orderId=${orderId}&message=${encodeURIComponent(data.message || 'Payment was not successful')}`);
        } else {
          router.push(`/dashboard?payment=pending&orderId=${orderId}`);
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Failed to verify payment status. Please contact support if this persists.');
      }
    };

    verifyPayment();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {error ? (
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-500 hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            Verifying your payment...
          </p>
        </div>
      )}
    </div>
  );
} 