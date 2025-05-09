import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

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
        }),
      });

      if (!response.ok) {
        throw new Error('Payment request failed');
      }

      const data = await response.json();

      // Here you would typically redirect to Netopia's payment page
      // or handle the payment request according to their documentation
      console.log('Payment request:', data);

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

  return (
    <>
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Payment</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Subscription Type</p>
            <p className="font-medium">{subscriptionType}</p>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </div>
      </div>
      <Toaster />
    </>
  );
}; 