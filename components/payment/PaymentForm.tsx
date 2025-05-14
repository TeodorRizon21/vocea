import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import NetopiaPaymentForm from '@/components/NetopiaPaymentForm';

interface PaymentFormProps {
  subscriptionId: string;
  subscriptionType: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export const PaymentForm = ({
  subscriptionId,
  subscriptionType,
  onSuccess,
  onError
}: PaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [netopiaFields, setNetopiaFields] = useState<null | { env_key: string; data: string; iv: string; cipher: string }>(null);
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
          subscriptionId,
          subscriptionType,
          billingInfo: {
            firstName: "Test", // This should come from a form
            lastName: "User",
            email: "test@example.com",
            phone: "1234567890",
            address: "Test Address"
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Payment request failed');
      }

      const data = await response.json();
      console.log('Payment request response:', data);

      if (data.success && data.env_key && data.data && data.iv && data.cipher) {
        setNetopiaFields({
          env_key: data.env_key,
          data: data.data,
          iv: data.iv,
          cipher: data.cipher
        });
      } else {
        throw new Error('Invalid payment response');
      }

      toast({
        title: "Payment initiated",
        description: "You will be redirected to the payment page.",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Payment error:', error);
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

  if (netopiaFields) {
    return (
      <NetopiaPaymentForm
        envKey={netopiaFields.env_key}
        data={netopiaFields.data}
        iv={netopiaFields.iv}
        cipher={netopiaFields.cipher}
      />
    );
  }

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
    >
      {isLoading ? 'Processing...' : 'Pay Now'}
    </button>
  );
}; 