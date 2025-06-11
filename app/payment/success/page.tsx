"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/LanguageToggle";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const translations = {
    ro: {
      title: "Plata reușită!",
      message: "Mulțumim! Plata a fost procesată cu succes. Abonamentul tău a fost activat.",
      redirecting: "Te redirecționăm către dashboard...",
      redirectIn: "Vei fi redirecționat către dashboard în 5 secunde.",
      goToDashboard: "Mergi la Dashboard"
    },
    en: {
      title: "Payment Successful!",
      message: "Thank you! Your payment has been processed successfully. Your subscription has been activated.",
      redirecting: "Redirecting you to the dashboard...",
      redirectIn: "You will be redirected to the dashboard in 5 seconds.",
      goToDashboard: "Go to Dashboard"
    }
  };

  const t = translations[language as keyof typeof translations];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRedirecting(true);
      router.push("/dashboard");
      toast({
        title: "Success",
        description: t.message,
      });
    }, 5000); // Redirect after 5 seconds

    return () => clearTimeout(timer);
  }, [router, toast, t.message]);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {t.message}
          </p>
          <p className="text-sm text-gray-500">
            {isRedirecting ? t.redirecting : t.redirectIn}
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="mt-4"
          >
            {t.goToDashboard}
          </Button>
        </div>
      </Card>
    </div>
  );
} 