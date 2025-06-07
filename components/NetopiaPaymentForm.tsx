import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NetopiaPaymentFormProps {
  redirectUrl: string;
  formData: Record<string, string>;
  orderId: string;
}

const NetopiaPaymentForm = ({ redirectUrl, formData, orderId }: NetopiaPaymentFormProps) => {
  const router = useRouter();

  useEffect(() => {
    if (redirectUrl && formData) {
      console.log('[NETOPIA_V2] Redirecting to hosted payment page:', {
        redirectUrl,
        orderId,
        hasFormData: Object.keys(formData).length > 0
      });

      // Create and submit form to Netopia v2.x
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = redirectUrl;

      // Add all form data fields received from Netopia
      Object.entries(formData).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      // Append form to body and submit
      document.body.appendChild(form);
      form.submit();
    } else {
      // If no redirect URL or form data, show error
      console.error('[NETOPIA_V2] Missing redirectUrl or formData');
      router.push('/subscriptions?error=payment_setup_failed');
    }
  }, [redirectUrl, formData, orderId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
        Se redirectioneaza catre pagina de plata Netopia...
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500">
        Comanda: {orderId}
      </p>
    </div>
  );
};

export default NetopiaPaymentForm; 