"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderDetails {
  plan: string;
  status: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const orderId = searchParams.get('orderId');
      if (!orderId) {
        router.push('/dashboard');
        return;
      }

      try {
        const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
        const data = await response.json();

        if (response.ok && data.status === 'COMPLETED') {
          setOrderDetails({
            plan: data.plan,
            status: data.status
          });
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        router.push('/dashboard');
      }
    };

    fetchOrderDetails();
  }, [searchParams, router]);

  useEffect(() => {
    if (orderDetails) {
      const timer = setTimeout(() => {
        setIsRedirecting(true);
        router.push("/dashboard");
        toast({
          title: "Success",
          description: `Your ${orderDetails.plan} subscription has been activated. Welcome to your upgraded plan!`,
        });
      }, 5000); // Redirect after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [orderDetails, router, toast]);

  if (!orderDetails) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for your payment. Your {orderDetails.plan} subscription has been activated.
          </p>
          <p className="text-sm text-gray-500">
            {isRedirecting 
              ? "Redirecting you to the dashboard..." 
              : "You will be redirected to the dashboard in 5 seconds."}
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="mt-4"
          >
            Go to Dashboard Now
          </Button>
        </div>
      </Card>
    </div>
  );
} 