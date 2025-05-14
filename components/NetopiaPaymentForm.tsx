import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NetopiaPaymentFormProps {
  envKey: string;
  data: string;
  iv: string;
  cipher: string;
}

const NetopiaPaymentForm = ({ envKey, data, iv, cipher }: NetopiaPaymentFormProps) => {
  const router = useRouter();

  useEffect(() => {
    // Log the data being sent
    console.log('Payment Form Data:', {
      envKey,
      data,
      iv,
      cipher
    });

    // Create form element
    const form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', 'https://sandboxsecure.mobilpay.ro');
    form.setAttribute('accept-charset', 'utf-8');

    // Add SSL bypass for development
    if (process.env.NODE_ENV === 'development') {
      // Set environment variable to bypass SSL check
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.log('SSL verification disabled for development environment');
    }

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

    // Create and append iv input
    const ivInput = document.createElement('input');
    ivInput.setAttribute('type', 'hidden');
    ivInput.setAttribute('name', 'iv');
    ivInput.setAttribute('value', iv);
    form.appendChild(ivInput);

    // Create and append cipher input
    const cipherInput = document.createElement('input');
    cipherInput.setAttribute('type', 'hidden');
    cipherInput.setAttribute('name', 'cipher');
    cipherInput.setAttribute('value', cipher);
    form.appendChild(cipherInput);

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
  }, [envKey, data, iv, cipher]);

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