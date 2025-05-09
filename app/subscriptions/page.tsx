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

export default function SubscriptionsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { language, forceRefresh } = useLanguage();
  const [selectedSubscription, setSelectedSubscription] = useState("Basic");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [netopiaFields, setNetopiaFields] = useState<null | { envKey: string; data: string }>(null);

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
      // If selecting a paid plan, initiate payment
      if (pendingSubscription !== "Basic") {
        const response = await fetch("/api/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            subscriptionType: pendingSubscription
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to initialize payment");
        }

        const data = await response.json();
        if (data.envKey && data.data) {
          setNetopiaFields({
            envKey: data.envKey,
            data: data.data,
          });
          return;
        }
      }

      // For Basic plan or if payment initialization failed, update subscription directly
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
          setSelectedSubscription(data.plan || "Basic");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 sm:px-6 lg:px-8">
      {netopiaFields ? (
        <NetopiaPaymentForm
          envKey={netopiaFields.envKey}
          data={netopiaFields.data}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-purple-600">
              {content.availablePlans}
            </h1>
            <UserProfile />
          </div>

          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {content.choosePlan}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              {content.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {subscriptions.map((subscription, index) => (
              <motion.div
                key={subscription.name}
                className="w-full max-w-md mx-auto"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.2 },
                }}
                style={{
                  perspective: "1000px",
                  transformStyle: "preserve-3d",
                  zIndex: subscription.popular ? 20 : 10,
                }}
              >
                <div
                  className={`${subscription.color} ${
                    subscription.textColor
                  } border ${
                    subscription.borderColor
                  } rounded-3xl shadow-xl overflow-hidden h-full flex flex-col relative ${
                    subscription.popular ? "lg:scale-105 z-10" : ""
                  }`}
                  style={{
                    transform: `rotateY(${
                      index === 0 ? "5deg" : index === 2 ? "-5deg" : "0deg"
                    })`,
                    boxShadow: subscription.popular
                      ? "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                      : "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {subscription.popular && (
                    <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 sm:px-4 py-1 rounded-bl-lg text-xs sm:text-sm font-bold">
                      {content.popular}
                    </div>
                  )}
                  {subscription.tag && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 sm:px-4 py-1 rounded-bl-lg text-xs sm:text-sm font-bold">
                      {subscription.tag}
                    </div>
                  )}

                  <div className="px-4 sm:px-6 py-6 sm:py-8 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-base sm:text-lg font-medium mb-2">
                      {subscription.name}
                    </div>
                    <div
                      className={`text-3xl sm:text-4xl font-bold mb-1 ${subscription.accentColor}`}
                    >
                      {subscription.price}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {subscription.name === "Basic" ? content.noCard : content.billedMonthly}
                    </div>
                  </div>

                  <div className="flex-grow px-4 sm:px-6 py-4 sm:py-6">
                    <ul className="space-y-3 sm:space-y-4">
                      {subscription.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <div
                            className={`mt-0.5 mr-3 rounded-full p-1 ${
                              feature.available
                                ? "text-green-500 bg-green-100 dark:bg-green-900/30"
                                : "text-gray-400 bg-gray-100 dark:bg-gray-800"
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <span
                            className={`text-sm sm:text-base ${
                              feature.available ? "" : "text-gray-400 line-through"
                            }`}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-2">
                    <button
                      onClick={() => handleSubscriptionChange(subscription.name)}
                      className={`w-full py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 ${
                        selectedSubscription === subscription.name
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : subscription.buttonColor
                      }`}
                      disabled={selectedSubscription === subscription.name}
                    >
                      {selectedSubscription === subscription.name
                        ? content.currentPlan
                        : content.select}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-8 sm:mt-16">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-2 sm:py-3 px-6 sm:px-8 rounded-xl transition-all duration-200"
            >
              {content.toDashboard}
            </button>
          </div>
        </>
      )}

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmSubscriptionChange}
        title={content.changeSubscription}
        message={`${content.confirmChange} ${pendingSubscription}?`}
      />
    </div>
  );
}
