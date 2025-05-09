import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NetopiaPaymentFormProps {
  envKey: string;
  data: string;
}

const NetopiaPaymentForm = ({ envKey, data }: NetopiaPaymentFormProps) => {
  const router = useRouter();

  useEffect(() => {
    // Log the data being sent
    console.log('Payment Form Data:', {
      envKey,
      data
    });

    // Create form element
    const form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', 'https://sandboxsecure.mobilpay.ro');
    form.setAttribute('accept-charset', 'utf-8');

    // Create and append env_key input
    const envKeyInput = document.createElement('input');
    envKeyInput.setAttribute('type', 'hidden');
    envKeyInput.setAttribute('name', 'env_key');
    envKeyInput.setAttribute('value', envKey);
    form.appendChild(envKeyInput);

    // Create and append data input
    const dataInput = document.createElement('input');
    dataInput.setAttribute('type', 'hidden');
    dataInput.setAttribute('name', 'data');
    dataInput.setAttribute('value', data);
    form.appendChild(dataInput);

    // Log the form HTML for debugging
    console.log('Form HTML:', form.outerHTML);

    // Append form to body
    document.body.appendChild(form);

    // Submit form
    try {
      form.submit();
    } catch (error) {
      console.error('Form submission error:', error);
    }

    // Clean up
    return () => {
      if (document.body.contains(form)) {
        document.body.removeChild(form);
      }
    };
  }, [envKey, data]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Redirecting to payment page...
      </p>
    </div>
  );
};

export default NetopiaPaymentForm; 