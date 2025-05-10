import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageToggle';

interface SubscriptionStatusProps {
  subscription: {
    plan: string;
    status: string;
    endDate: string | Date | null;
  };
  onCancelSubscription: () => Promise<Response>;
}

export default function SubscriptionStatus({ subscription, onCancelSubscription }: SubscriptionStatusProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      const response = await onCancelSubscription();
      const data = await response.json();
      
      toast({
        title: language === 'ro' ? "Abonament anulat" : "Subscription cancelled",
        description: data.message || (language === 'ro' 
          ? "Abonamentul tău va expira la sfârșitul perioadei curente de facturare." 
          : "Your subscription will end at the current billing period."),
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: language === 'ro' ? "Eroare" : "Error",
        description: language === 'ro' 
          ? "Nu s-a putut anula abonamentul. Te rugăm să încerci din nou." 
          : "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const daysUntilRenewal = subscription.endDate 
    ? Math.ceil(
        (new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Format the end date safely
  const formattedEndDate = subscription.endDate 
    ? new Date(subscription.endDate).toLocaleDateString() 
    : null;
    
  // Is subscription active but canceled (will not renew)
  const isCanceled = subscription.status === 'cancelled';
  // Is subscription active and set to auto-renew
  const isAutoRenew = subscription.status === 'active' && subscription.plan !== 'Basic';
  
  // Translate status
  const getTranslatedStatus = (status: string) => {
    if (language === 'ro') {
      switch (status) {
        case 'active': return 'activ';
        case 'cancelled': return 'anulat';
        case 'expired': return 'expirat';
        default: return status;
      }
    }
    return status;
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {language === 'ro' ? 'Plan curent:' : 'Current Plan:'} {subscription.plan}
          </h3>
          <p className="text-sm text-gray-500">
            {language === 'ro' ? 'Status:' : 'Status:'} {getTranslatedStatus(subscription.status)}
            {isCanceled && (language === 'ro' ? " (Nu se reînnoiește)" : " (Not renewing)")}
          </p>
        </div>
        
        {/* Show days until access ends for cancelled subscription */}
        {isCanceled && daysUntilRenewal !== null && daysUntilRenewal > 0 && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-orange-600">
              {language === 'ro' 
                ? `${daysUntilRenewal} zile de acces rămase` 
                : `${daysUntilRenewal} days of access remaining`}
            </span>
          </div>
        )}
        
        {/* Show days until renewal for active subscription */}
        {isAutoRenew && daysUntilRenewal !== null && daysUntilRenewal > 0 && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm">
              {language === 'ro' 
                ? `${daysUntilRenewal} zile până la reînnoire` 
                : `${daysUntilRenewal} days until renewal`}
            </span>
          </div>
        )}
        
        {/* Show unlimited access for Basic plan */}
        {subscription.plan === 'Basic' && (
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600">
              {language === 'ro' ? 'Acces nelimitat' : 'Unlimited access'}
            </span>
          </div>
        )}
      </div>

      {/* Auto-renewal notice for active subscriptions */}
      {isAutoRenew && (
        <div className="mt-4">
          <div className="flex items-center space-x-2 text-yellow-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              {language === 'ro' 
                ? `Abonamentul tău se va reînnoi automat pe ${formattedEndDate}` 
                : `Your subscription will automatically renew on ${formattedEndDate}`}
            </p>
          </div>
          
          <Button
            variant="destructive"
            onClick={handleCancelSubscription}
            disabled={isCancelling}
          >
            {isCancelling 
              ? (language === 'ro' ? 'Se anulează...' : 'Cancelling...') 
              : (language === 'ro' ? 'Anulează Abonamentul' : 'Cancel Subscription')}
          </Button>
        </div>
      )}
      
      {/* Cancellation notice */}
      {isCanceled && (
        <div className="mt-4">
          <div className="flex items-center space-x-2 text-orange-600">
            <XCircle className="h-5 w-5" />
            <p className="text-sm">
              {language === 'ro' 
                ? `Abonamentul tău este anulat și va expira pe ${formattedEndDate}. Vei avea acces până atunci.` 
                : `Your subscription is cancelled and will end on ${formattedEndDate}. You will retain access until then.`}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
} 