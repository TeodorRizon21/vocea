"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/components/LanguageToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import NetopiaPaymentForm from "@/components/NetopiaPaymentForm";

interface OrderFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export default function OrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, user } = useUser();
  const { language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [netopiaPayment, setNetopiaPayment] = useState<null | { redirectUrl: string; formData: Record<string, string>; orderId: string }>(null);

  const [formData, setFormData] = useState<OrderFormData>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.emailAddresses[0]?.emailAddress || "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });

  const translations = {
    ro: {
      title: "Completare comandă",
      subtitle: "Vă rugăm să completați informațiile de facturare pentru a continua cu plata",
      firstName: "Prenume",
      lastName: "Nume",
      email: "Email",
      phone: "Număr de telefon",
      address: "Adresă",
      city: "Oraș",
      country: "Țară",
      postalCode: "Cod poștal",
      payNow: "Plătește acum",
      required: "Acest câmp este obligatoriu",
      invalidEmail: "Adresa de email nu este validă",
      invalidPhone: "Numărul de telefon nu este valid",
      error: "A apărut o eroare. Vă rugăm să încercați din nou.",
    },
    en: {
      title: "Complete Order",
      subtitle: "Please fill in your billing information to proceed with the payment",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone Number",
      address: "Address",
      city: "City",
      country: "Country",
      postalCode: "Postal Code",
      payNow: "Pay Now",
      required: "This field is required",
      invalidEmail: "Invalid email address",
      invalidPhone: "Invalid phone number",
      error: "An error occurred. Please try again.",
    },
  };

  const content = translations[language as keyof typeof translations];

  const validateForm = () => {
    if (!formData.firstName.trim()) return false;
    if (!formData.lastName.trim()) return false;
    if (!formData.email.trim()) return false;
    if (!formData.phone.trim()) return false;
    if (!formData.address.trim()) return false;
    if (!formData.city.trim()) return false;
    if (!formData.country.trim()) return false;
    if (!formData.postalCode.trim()) return false;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return false;

    // Basic phone validation (adjust regex based on your requirements)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError(content.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const subscriptionType = searchParams.get("plan");
      if (!subscriptionType) {
        throw new Error("No subscription type specified");
      }

      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionType,
          billingInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            postalCode: formData.postalCode
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize payment");
      }

      const data = await response.json();
      if (data.success && data.redirectUrl && data.formData && data.orderId) {
        setNetopiaPayment({
          redirectUrl: data.redirectUrl,
          formData: data.formData,
          orderId: data.orderId,
        });
      } else {
        throw new Error("Invalid payment response");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setError(content.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  if (netopiaPayment) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">{content.title}</h1>
          <NetopiaPaymentForm
            redirectUrl={netopiaPayment.redirectUrl}
            formData={netopiaPayment.formData}
            orderId={netopiaPayment.orderId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{content.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{content.subtitle}</p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{content.firstName} *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{content.lastName} *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{content.email} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{content.phone} *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{content.address} *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{content.city} *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{content.country} *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">{content.postalCode} *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !validateForm()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? "..." : content.payNow}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 