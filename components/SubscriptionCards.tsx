"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/LanguageToggle"

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
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { language } = useLanguage()

  const subscriptions = [
    { 
      name: "Basic", 
      color: "bg-white dark:bg-black", 
      description: language === "ro" ? "Acces la funcționalități de bază" : "Access to basic features",
      price: "0 RON"
    },
    { 
      name: "Premium", 
      color: "bg-gray-100", 
      description: language === "ro" ? "Acces la funcționalități premium" : "Access to premium features",
      price: "8 RON"
    },
    { 
      name: "Gold", 
      color: "bg-yellow-100", 
      description: language === "ro" ? "Acces la toate funcționalitățile" : "Access to all features",
      price: "28 RON"
    },
  ]

  const handleSubscriptionSelect = async (subscription: string) => {
    if (subscription === "Basic") {
      onSubscriptionChange(subscription)
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionType: subscription }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment")
      }

      // Redirect to Netopia payment page
      window.location.href = data.paymentUrl
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        variant: "destructive",
        title: language === "ro" ? "Eroare" : "Error",
        description: language === "ro" 
          ? "Nu s-a putut inițializa plata. Vă rugăm să încercați din nou."
          : "Could not initialize payment. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

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
          onClick={() => handleSubscriptionSelect(subscription.name)}
        >
          <CardHeader>
            <CardTitle>{subscription.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">{subscription.description}</p>
            <p className="font-semibold">{subscription.price}</p>
            {subscription.name !== "Basic" && (
              <Button
                className="mt-4 w-full"
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSubscriptionSelect(subscription.name)
                }}
              >
                {loading
                  ? language === "ro"
                    ? "Se procesează..."
                    : "Processing..."
                  : language === "ro"
                  ? "Alege"
                  : "Select"}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

