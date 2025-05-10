import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PaymentHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Payment history is temporarily unavailable.</p>
      </CardContent>
    </Card>
  );
}