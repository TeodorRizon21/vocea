"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageToggle";

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const translations = {
    ro: {
      title: "Plata nereușită",
      message: "Ne pare rău, plata nu a putut fi procesată cu succes. Te rugăm să încerci din nou.",
      tryAgain: "Încearcă din nou",
      returnToDashboard: "Înapoi la Dashboard"
    },
    en: {
      title: "Payment Failed", 
      message: "Sorry, your payment could not be processed successfully. Please try again.",
      tryAgain: "Try Again",
      returnToDashboard: "Return to Dashboard"
    }
  };

  const t = translations[language as keyof typeof translations];

  // Get error message from URL if available
  const errorMessage = searchParams.get('message');

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <XCircle className="h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {t.message}
            {errorMessage && (
              <span className="block mt-2 text-sm text-gray-500">
                {errorMessage}
              </span>
            )}
          </p>
          <div className="flex gap-4">
            <Button asChild variant="default">
              <Link href="/subscriptions">
                {t.tryAgain}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                {t.returnToDashboard}
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 