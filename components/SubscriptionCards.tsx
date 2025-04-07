"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface SubscriptionCardsProps {
  selectedSubscription: string
  onSubscriptionChange: (subscription: string) => void
  className?: string
}

export default function SubscriptionCards({
  selectedSubscription,
  onSubscriptionChange,
  className,
}: SubscriptionCardsProps) {
  const subscriptions = [
    { name: "Basic", color: "bg-white dark:bg-black", description: "Access to basic features" },
    { name: "Premium", color: "bg-gray-100", description: "Access to premium features" },
    { name: "Gold", color: "bg-yellow-100", description: "Access to all features" },
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {subscriptions.map((subscription) => (
        <Card
          key={subscription.name}
          className={`${subscription.color} cursor-pointer transition-all duration-200 shadow-md ${
            selectedSubscription === subscription.name ? "ring-2 ring-purple-600 dark:ring-purple-400" : ""
          } ${subscription.name === "Gold" ? "text-black" : ""} ${
            subscription.name === "Premium" ? "dark:bg-gray-100 dark:text-gray-800" : ""
          }`}
          onClick={() => onSubscriptionChange(subscription.name)}
        >
          <CardHeader>
            <CardTitle>{subscription.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{subscription.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

