import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentFailedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Failed</h1>
        <p className="text-muted-foreground max-w-[600px]">
          We couldn't process your payment. This could be due to insufficient funds,
          incorrect card details, or a temporary issue. Please try again or use a different payment method.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/subscriptions">
              Try Again
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 