import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import NetopiaPaymentForm from '@/components/NetopiaPaymentForm';

interface PaymentFormProps {
  subscriptionId: string;
  subscriptionType: string;
  isRecurring?: boolean;
  onSuccess?: () => void;
  onError?: () => void;
}

export const PaymentForm = ({
  subscriptionId,
  subscriptionType,
  isRecurring = true, // Default to true for subscriptions
  onSuccess,
  onError
}: PaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [netopiaPayment, setNetopiaPayment] = useState<null | { redirectUrl: string; formData: Record<string, string>; orderId: string }>(null);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionType,
          billingInfo: {
            firstName: "Test", // This should come from a form
            lastName: "User",
            email: "test@example.com",
            phone: "1234567890",
            address: "Test Address",
            city: "Bucharest",
            postalCode: "123456"
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Payment request failed');
      }

      const data = await response.json();
      console.log('[PAYMENT_FORM] Payment request response:', data);

      if (data.success && data.redirectUrl && data.formData && data.orderId) {
        setNetopiaPayment({
          redirectUrl: data.redirectUrl,
          formData: data.formData,
          orderId: data.orderId
        });

        toast({
          title: isRecurring ? "Recurring payment initiated" : "One-time payment initiated",
          description: "You will be redirected to the Netopia payment page.",
        });

        onSuccess?.();
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      console.error('[PAYMENT_FORM] Payment error:', error);
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      onError?.();
    } finally {
      setIsLoading(false);
    }
  };

  if (netopiaPayment) {
    return (
      <NetopiaPaymentForm
        redirectUrl={netopiaPayment.redirectUrl}
        formData={netopiaPayment.formData}
        orderId={netopiaPayment.orderId}
      />
    );
  }

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
    >
      {isLoading ? 'Processing...' : isRecurring ? 'Subscribe Now' : 'Pay Now'}
    </button>
  );
}; 