"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import UserProfile from "@/components/UserProfile";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function SubscriptionsPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [selectedSubscription, setSelectedSubscription] = useState("Basic");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState("");
  const [loading, setLoading] = useState(true);

  const subscriptions = [
    {
      name: "Basic",
      price: "Gratuit",
      color: "bg-white dark:bg-black",
      textColor: "text-gray-900 dark:text-white",
      accentColor: "text-gray-700 dark:text-gray-300",
      buttonColor: "bg-gray-600 hover:bg-gray-700 text-white",
      borderColor: "border-gray-200 dark:border-gray-800",
      features: [
        { text: "Acces la pagina de browse", available: true },
        { text: "Vizualizare listă completă de proiecte", available: true },
        {
          text: "Vizualizare listă completă de topicuri forum",
          available: true,
        },
        { text: "Acces la proiecte individuale", available: false },
        { text: "Acces la topicuri de forum", available: false },
        { text: "Creare proiecte noi", available: false },
        { text: "Creare topicuri noi în forum", available: false },
      ],
    },
    {
      name: "Premium",
      price: "20 RON/lună",
      color: "bg-gray-100 dark:bg-gray-100",
      textColor: "text-gray-900",
      accentColor: "text-purple-500",
      buttonColor: "bg-purple-500 hover:bg-purple-600 text-white",
      borderColor: "border-purple-200 dark:border-purple-800",
      popular: true,
      features: [
        { text: "Acces la pagina de browse", available: true },
        { text: "Vizualizare listă completă de proiecte", available: true },
        {
          text: "Vizualizare listă completă de topicuri forum",
          available: true,
        },
        { text: "Acces la proiecte individuale", available: true },
        { text: "Acces la topicuri de forum", available: true },
        { text: "Creare proiecte noi (max 4)", available: true },
        { text: "Creare topicuri noi în forum", available: true },
      ],
    },
    {
      name: "Gold",
      price: "50 RON/lună",
      color: "bg-yellow-50",
      textColor: "text-black",
      accentColor: "text-amber-500",
      buttonColor: "bg-amber-500 hover:bg-amber-600 text-white",
      borderColor: "border-amber-200 dark:border-amber-800",
      popular: false,
      tag: "Nelimitat",
      features: [
        { text: "Acces la pagina de browse", available: true },
        { text: "Vizualizare listă completă de proiecte", available: true },
        {
          text: "Vizualizare listă completă de topicuri forum",
          available: true,
        },
        { text: "Acces la proiecte individuale", available: true },
        { text: "Acces la topicuri de forum", available: true },
        { text: "Creare proiecte nelimitate", available: true },
        { text: "Creare topicuri nelimitate în forum", available: true },
      ],
    },
  ];

  const handleSubscriptionChange = (newSubscription: string) => {
    setPendingSubscription(newSubscription);
    setIsDialogOpen(true);
  };

  const confirmSubscriptionChange = async () => {
    setIsDialogOpen(false);
    setSelectedSubscription(pendingSubscription);

    try {
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
    <div className="pb-20">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-purple-600">
          Planuri disponibile
        </h1>
        <UserProfile />
      </div>

      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-4">
          Alege planul potrivit pentru tine
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Descoperă toate funcționalitățile platformei noastre cu unul din
          planurile premium. Alege planul care se potrivește cel mai bine
          nevoilor tale.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-8 md:gap-1 max-w-6xl mx-auto px-4">
        {subscriptions.map((subscription, index) => (
          <motion.div
            key={subscription.name}
            className="w-full md:w-1/3 max-w-md"
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
                subscription.popular ? "md:scale-110 z-10" : ""
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
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-lg text-sm font-bold">
                  Popular
                </div>
              )}
              {subscription.tag && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1 rounded-bl-lg text-sm font-bold">
                  {subscription.tag}
                </div>
              )}

              <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
                <div className="text-lg font-medium mb-2">
                  {subscription.name}
                </div>
                <div
                  className={`text-4xl font-bold mb-1 ${subscription.accentColor}`}
                >
                  {subscription.price}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {subscription.name === "Basic"
                    ? "Nu necesită card"
                    : "Facturat lunar"}
                </div>
              </div>

              <div className="flex-grow px-6 py-6">
                <ul className="space-y-4">
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
                        className={
                          feature.available ? "" : "text-gray-400 line-through"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 pb-8 pt-2">
                <button
                  onClick={() => handleSubscriptionChange(subscription.name)}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                    selectedSubscription === subscription.name
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : subscription.buttonColor
                  }`}
                  disabled={selectedSubscription === subscription.name}
                >
                  {selectedSubscription === subscription.name
                    ? "Planul tău curent"
                    : "Selectează"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center mt-16">
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-3 px-8 rounded-xl transition-all duration-200"
        >
          Înapoi la Dashboard
        </button>
      </div>

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmSubscriptionChange}
        title="Schimbare abonament"
        message={`Ești sigur că vrei să schimbi abonamentul la ${pendingSubscription}?`}
      />
    </div>
  );
}
