"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/LanguageToggle"
import { Check } from "lucide-react"
import { motion } from "framer-motion"

interface SubscriptionCardsProps {
  selectedSubscription: string
  onSubscriptionChange: (subscription: string) => void
  className?: string
  currentPlan?: string
}

// Plan hierarchy for button disable logic
const PLAN_HIERARCHY = {
  Basic: 1,
  Premium: 2,
  Gold: 3
} as const;

export default function SubscriptionCards({
  selectedSubscription,
  onSubscriptionChange,
  className,
  currentPlan
}: SubscriptionCardsProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { language } = useLanguage()

  const content = {
    ro: {
      popular: "Popular",
      unlimited: "Nelimitat",
      noCard: "Nu necesită card",
      billedMonthly: "Facturat lunar",
      currentPlan: "Planul curent",
      select: "Selectează",
      notAvailable: "Nu este disponibil",
      processing: "Se procesează...",
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
      popular: "Popular",
      unlimited: "Unlimited",
      noCard: "No card required",
      billedMonthly: "Billed monthly",
      currentPlan: "Current Plan",
      select: "Select",
      notAvailable: "Not available",
      processing: "Processing...",
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

  const translations = content[language as keyof typeof content];

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
        { text: translations.features[0], available: true },
        { text: translations.features[1], available: true },
        { text: translations.features[2], available: true },
        { text: translations.features[3], available: false },
        { text: translations.features[4], available: false },
        { text: language === "ro" ? "Creare proiecte noi" : "Create new projects", available: false },
        { text: translations.features[6], available: false },
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
        { text: translations.features[0], available: true },
        { text: translations.features[1], available: true },
        { text: translations.features[2], available: true },
        { text: translations.features[3], available: true },
        { text: translations.features[4], available: true },
        { text: language === "ro" ? "Creare proiecte noi (max 4)" : "Create new projects (max 4)", available: true },
        { text: translations.features[6], available: true },
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
      tag: translations.unlimited,
      features: [
        { text: translations.features[0], available: true },
        { text: translations.features[1], available: true },
        { text: translations.features[2], available: true },
        { text: translations.features[3], available: true },
        { text: translations.features[4], available: true },
        { text: language === "ro" ? "Creare proiecte nelimitate" : "Create unlimited projects", available: true },
        { text: language === "ro" ? "Creare topicuri nelimitate în forum" : "Create unlimited forum topics", available: true },
      ],
    },
  ];

  // Function to check if a plan's button should be disabled
  const isButtonDisabled = (planName: string) => {
    if (!currentPlan) return false;
    const currentRank = PLAN_HIERARCHY[currentPlan as keyof typeof PLAN_HIERARCHY] || 0;
    const planRank = PLAN_HIERARCHY[planName as keyof typeof PLAN_HIERARCHY] || 0;
    return planRank < currentRank;
  };

  const handleSubscriptionSelect = async (subscription: string) => {
    if (isButtonDisabled(subscription)) return;
    
    // Always use the onSubscriptionChange handler to show the dialog first
    onSubscriptionChange(subscription);
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto ${className}`}>
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
            className={`${subscription.color} ${subscription.textColor} border ${
              subscription.name === selectedSubscription
                ? "border-green-500 border-2"
                : subscription.borderColor
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
                {translations.popular}
              </div>
            )}
            {subscription.tag && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 sm:px-4 py-1 rounded-bl-lg text-xs sm:text-sm font-bold">
                {subscription.tag}
              </div>
            )}
            {subscription.name === selectedSubscription && (
              <div className="absolute top-0 left-0 bg-green-500 text-white px-3 sm:px-4 py-1 rounded-br-lg text-xs sm:text-sm font-bold">
                {translations.currentPlan}
              </div>
            )}

            <div className="px-4 sm:px-6 py-6 sm:py-8 border-b border-gray-200 dark:border-gray-700">
              <div className="text-base sm:text-lg font-medium mb-2">
                {subscription.name}
              </div>
              <div className={`text-3xl sm:text-4xl font-bold mb-1 ${subscription.accentColor}`}>
                {subscription.price}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {subscription.name === "Basic" ? translations.noCard : translations.billedMonthly}
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
                onClick={() => subscription.name !== currentPlan && handleSubscriptionSelect(subscription.name)}
                className={`w-full py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 ${
                  isButtonDisabled(subscription.name)
                    ? "bg-gray-400 cursor-not-allowed"
                    : subscription.name === currentPlan
                    ? "bg-green-600 text-white"
                    : subscription.name === selectedSubscription
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : subscription.buttonColor
                }`}
                disabled={isButtonDisabled(subscription.name) || loading}
              >
                {loading
                  ? translations.processing
                  : isButtonDisabled(subscription.name)
                  ? translations.notAvailable
                  : subscription.name === currentPlan
                  ? translations.currentPlan
                  : translations.select}
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

