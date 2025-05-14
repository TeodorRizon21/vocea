"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);

  const handleGoToDashboard = async () => {
    try {
      setIsActivating(true);
      const response = await fetch("/api/subscription/activate", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to activate subscription");
      }

      toast({
        title: "Success",
        description: "Your subscription has been activated successfully!",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error activating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to activate subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for your payment. Your subscription will be activated when you go to your dashboard.
          </p>
          <Button
            onClick={handleGoToDashboard}
            disabled={isActivating}
            className="mt-4"
          >
            {isActivating ? "Activating..." : "Go to Dashboard"}
          </Button>
        </div>
      </Card>
    </div>
  );
} 