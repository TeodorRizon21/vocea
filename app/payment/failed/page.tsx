"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Link from "next/link";

interface OrderDetails {
  plan: string;
  status: string;
  message?: string;
}

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

        if (response.ok) {
          setOrderDetails({
            plan: data.plan,
            status: data.status,
            message: searchParams.get('message') || data.message || 'Payment was not successful'
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

  if (!orderDetails) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <XCircle className="h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold">Payment Failed</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            We couldn't process your payment for the {orderDetails.plan} subscription. 
            {orderDetails.message && ` ${orderDetails.message}`}
          </p>
          <div className="flex gap-4">
            <Button asChild variant="default">
              <Link href="/subscriptions">
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 