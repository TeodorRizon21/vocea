"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import UserProfile from "@/components/UserProfile";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageToggle";
import NetopiaPaymentForm from "@/components/NetopiaPaymentForm";
import SubscriptionStatus from '@/components/SubscriptionStatus';
import SubscriptionCards from "@/components/SubscriptionCards";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { language, forceRefresh } = useLanguage();
  const { toast } = useToast();
  const [selectedSubscription, setSelectedSubscription] = useState("Basic");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [netopiaFields, setNetopiaFields] = useState<null | { env_key: string; data: string; iv: string; cipher: string }>(null);
  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    endDate: Date;
  } | null>(null);

  const translations = {
    ro: {
      availablePlans: "Planuri disponibile",
      choosePlan: "Alege planul potrivit pentru tine",
      description: "Descoperă toate funcționalitățile platformei noastre cu unul din planurile premium. Alege planul care se potrivește cel mai bine nevoilor tale.",
      popular: "Popular",
      unlimited: "Nelimitat",
      noCard: "Nu necesită card",
      billedMonthly: "Facturat lunar",
      currentPlan: "Planul tău curent",
      select: "Selectează",
      toDashboard: "Mergi la Dashboard",
      changeSubscription: "Schimbare abonament",
      confirmChange: "Ești sigur că vrei să schimbi abonamentul la",
      cancelSubscription: "Anulare abonament",
      confirmCancel: "Ești sigur că vrei să anulezi abonamentul? Această acțiune nu poate fi anulată.",
      yes: "Da",
      no: "Nu",
      features: [
        "Acces la pagina de browse",
        "Vizualizare listă completă de proiecte",
        "Vizualizare listă completă de topicuri forum",
        "Acces la proiecte individuale",
        "Acces la topicuri de forum",
        "Creare proiecte noi",
        "Creare topicuri noi în forum"
      ]
    },
    en: {
      availablePlans: "Available Plans",
      choosePlan: "Choose the Right Plan for You",
      description: "Discover all the features of our platform with one of our premium plans. Choose the plan that best suits your needs.",
      popular: "Popular",
      unlimited: "Unlimited",
      noCard: "No card required",
      billedMonthly: "Billed monthly",
      currentPlan: "Your current plan",
      select: "Select",
      toDashboard: "Go to Dashboard",
      changeSubscription: "Change Subscription",
      confirmChange: "Are you sure you want to change your subscription to",
      cancelSubscription: "Cancel Subscription",
      confirmCancel: "Are you sure you want to cancel your subscription? This action cannot be undone.",
      yes: "Yes",
      no: "No",
      features: [
        "Access to browse page",
        "View complete project list",
        "View complete forum topics list",
        "Access to individual projects",
        "Access to forum topics",
        "Create new projects",
        "Create new forum topics"
      ]
    }
  };

  const content = translations[language as keyof typeof translations];

  const subscriptions = [
    {
      name: "Basic",
      price: language === "ro" ? "Gratuit" : "Free",
      color: "bg-white dark:bg-black",
      textColor: "text-gray-900 dark:text-white",
      accentColor: "text-gray-700 dark:text-gray-300",
      buttonColor: "bg-gray-600 hover:bg-gray-700 text-white",
      borderColor: "border-gray-200 dark:border-gray-800",
      features: [
        { text: content.features[0], available: true },
        { text: content.features[1], available: true },
        { text: content.features[2], available: true },
        { text: content.features[3], available: false },
        { text: content.features[4], available: false },
        { text: language === "ro" ? "Creare proiecte noi" : "Create new projects", available: false },
        { text: content.features[6], available: false },
      ],
    },
    {
      name: "Premium",
      price: language === "ro" ? "8 RON/lună" : "8 RON/month",
      color: "bg-gray-100 dark:bg-gray-100",
      textColor: "text-gray-900",
      accentColor: "text-purple-500",
      buttonColor: "bg-purple-500 hover:bg-purple-600 text-white",
      borderColor: "border-purple-200 dark:border-purple-800",
      popular: true,
      features: [
        { text: content.features[0], available: true },
        { text: content.features[1], available: true },
        { text: content.features[2], available: true },
        { text: content.features[3], available: true },
        { text: content.features[4], available: true },
        { text: language === "ro" ? "Creare proiecte noi (max 4)" : "Create new projects (max 4)", available: true },
        { text: content.features[6], available: true },
      ],
    },
    {
      name: "Gold",
      price: language === "ro" ? "28 RON/lună" : "28 RON/month",
      color: "bg-yellow-50",
      textColor: "text-black",
      accentColor: "text-amber-500",
      buttonColor: "bg-amber-500 hover:bg-amber-600 text-white",
      borderColor: "border-amber-200 dark:border-amber-800",
      popular: false,
      tag: content.unlimited,
      features: [
        { text: content.features[0], available: true },
        { text: content.features[1], available: true },
        { text: content.features[2], available: true },
        { text: content.features[3], available: true },
        { text: content.features[4], available: true },
        { text: language === "ro" ? "Creare proiecte nelimitate" : "Create unlimited projects", available: true },
        { text: language === "ro" ? "Creare topicuri nelimitate în forum" : "Create unlimited forum topics", available: true },
      ],
    },
  ];

  const handleSubscriptionChange = (newSubscription: string) => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    setPendingSubscription(newSubscription);
    setIsDialogOpen(true);
  };

  const confirmSubscriptionChange = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    setIsDialogOpen(false);
    setSelectedSubscription(pendingSubscription);

    try {
      // If selecting a paid plan, redirect to order page
      if (pendingSubscription !== "Basic") {
        router.push(`/order?plan=${pendingSubscription}`);
        return;
      }

      // For Basic plan, update subscription directly
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription: pendingSubscription }),
      });

      if (!response.ok) {
        console.error("Failed to update subscription");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/subscription");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data); // Data is directly the subscription object now
          setSelectedSubscription(data.plan); // Set the selected subscription to the current plan
          console.log('Fetched subscription data:', data);
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchSubscription();
    }
  }, [isLoaded]);

  const handleCancelSubscription = async () => {
    setIsCancelDialogOpen(true);
    return new Response(null, { status: 200 });
  };

  const confirmCancelSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to cancel subscription');
      }

      // Refresh subscription data
      const subscriptionResponse = await fetch('/api/subscription');
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData);
      }

      setIsCancelDialogOpen(false);

      // Show success toast
      toast({
        title: language === 'ro' ? 'Succes' : 'Success',
        description: data?.message || (language === 'ro' 
          ? 'Abonamentul a fost anulat cu succes.' 
          : 'Subscription has been cancelled successfully.'),
        variant: 'default',
      });

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      
      // Show error toast
      toast({
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: error instanceof Error 
          ? error.message 
          : (language === 'ro' 
              ? 'Nu s-a putut anula abonamentul. Vă rugăm să încercați din nou.' 
              : 'Could not cancel subscription. Please try again.'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{content.availablePlans}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{content.description}</p>

      {subscription && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{content.currentPlan}</h2>
          <SubscriptionStatus 
            subscription={subscription} 
            onCancelSubscription={handleCancelSubscription} 
          />
        </div>
      )}

      <SubscriptionCards
        selectedSubscription={selectedSubscription}
        onSubscriptionChange={handleSubscriptionChange}
        currentPlan={subscription?.plan}
        className="mt-8"
      />

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmSubscriptionChange}
        title={content.changeSubscription}
        message={`${content.confirmChange} ${pendingSubscription}?`}
        confirmText={content.yes}
        cancelText={content.no}
      />

      <ConfirmationDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={confirmCancelSubscription}
        title={content.cancelSubscription}
        message={content.confirmCancel}
        confirmText={content.yes}
        cancelText={content.no}
      />

      {netopiaFields && (
        <NetopiaPaymentForm
          envKey={netopiaFields.env_key}
          data={netopiaFields.data}
          iv={netopiaFields.iv}
          cipher={netopiaFields.cipher}
        />
      )}
    </div>
  );
}
