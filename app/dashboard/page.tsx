"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import UserProfile from "@/components/UserProfile";
import DashboardHero from "@/components/DashboardHero";
import ProfileInfo from "@/components/ProfileInfo";
import SubscriptionCards from "@/components/SubscriptionCards";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import UserActivity from "@/components/UserActivity";
import OnboardingDialog from "@/components/OnboardingDialog";
import EditProfileDialog from "@/components/EditProfileDialog";
import UserProjects from "@/components/UserProjects";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import RatingCard from "@/components/RatingCard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Crown, Shield, Star } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";
import { PaymentHistory } from '@/components/PaymentHistory';

interface UserData extends User {
  firstName?: string;
  lastName?: string;
  activity?: {
    projectsCreated: number;
    projectsJoined: number;
    commentsPosted: number;
    forumTopicsCreated: number;
    recentComments: Array<{
      id: number;
      content: string;
      projectTitle: string;
      topicId: string;
    }>;
  };
  averageRating: number | null;
  reviewCount: number;
  reviews?: Array<{
    id: string;
    score: number;
    comment?: string;
    createdAt: string;
    user?: {
      firstName: string | null;
      lastName: string | null;
    };
  }>;
}

interface EditProfileFormData {
  universityId: string;
  facultyId: string;
  city: string;
  year: string;
}

export default function DashboardPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [selectedSubscription, setSelectedSubscription] = useState("Basic");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru pagina cu useMemo
  const translations = useMemo(() => {
    return {
      dashboard: language === "ro" ? "Panou Principal" : "Dashboard",
      changeSubscription:
        language === "ro" ? "Schimbare Abonament" : "Change Subscription",
      changeSubscriptionMessage:
        language === "ro"
          ? `Ești sigur că vrei să schimbi abonamentul la ${pendingSubscription}?`
          : `Are you sure you want to change your subscription to ${pendingSubscription}?`,
      currentPlan:
        language === "ro" ? "Planul tău curent" : "Your current plan",
      viewAllPlans:
        language === "ro" ? "Vezi toate planurile" : "View all plans",
      // Traduceri pentru planuri
      premium: language === "ro" ? "Premium" : "Premium",
      premiumDesc:
        language === "ro"
          ? "Acces la funcționalități premium"
          : "Access to premium features",
      gold: language === "ro" ? "Gold" : "Gold",
      goldDesc:
        language === "ro"
          ? "Acces complet, fără limite"
          : "Full access, no limits",
      basic: language === "ro" ? "Basic" : "Basic",
      basicDesc:
        language === "ro"
          ? "Acces la funcționalități de bază"
          : "Access to basic features",
      // Traduceri pentru caracteristici
      accessAll:
        language === "ro"
          ? "Acces la toate proiectele"
          : "Access to all projects",
      accessAllTopics:
        language === "ro"
          ? "Acces la toate topicurile"
          : "Access to all topics",
      createProjects:
        language === "ro"
          ? "Creare proiecte (max 4)"
          : "Create projects (max 4)",
      createUnlimited:
        language === "ro"
          ? "Creare proiecte nelimitate"
          : "Create unlimited projects",
      limitedAccess: language === "ro" ? "Acces limitat" : "Limited access",
      viewOnly: language === "ro" ? "Doar vizualizare listă" : "View list only",
      noIndividual:
        language === "ro"
          ? "Fără acces la conținut individual"
          : "No access to individual content",
      // Traduceri pentru badge-uri
      popular: language === "ro" ? "Popular" : "Popular",
      unlimited: language === "ro" ? "Nelimitat" : "Unlimited",
    };
  }, [language, forceRefresh, pendingSubscription]);

  const checkRequiredInformation = useCallback((data: UserData | null) => {
    return (
      !data?.firstName ||
      !data?.lastName ||
      !data?.university ||
      !data?.city ||
      !data?.year
    );
  }, []);

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
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const data = await response.json();
        setUserData(data);

        // Check if user has all required information
        if (checkRequiredInformation(data)) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/subscription");
        if (response.ok) {
          const data = await response.json();
          setSelectedSubscription(data.plan || "Basic");
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    };

    if (isLoaded) {
      fetchUserData();
      fetchSubscription();
    }
  }, [isLoaded, checkRequiredInformation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const defaultActivity = {
    projectsCreated: 0,
    projectsJoined: 0,
    commentsPosted: 0,
    forumTopicsCreated: 0,
    recentComments: [] as Array<{
      id: number;
      content: string;
      projectTitle: string;
      topicId: string;
    }>,
  };

  // Funcție pentru a obține datele despre plan
  const getSubscriptionData = () => {
    switch (selectedSubscription) {
      case "Premium":
        return {
          name: translations.premium,
          icon: <Shield className="h-6 w-6 text-purple-500" />,
          description: translations.premiumDesc,
          features: [
            translations.accessAll,
            translations.accessAllTopics,
            translations.createProjects,
          ],
          color:
            "bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30",
          borderColor: "border-purple-200 dark:border-purple-800",
          iconBg: "bg-purple-100 dark:bg-purple-900/50",
          badge: translations.popular,
        };
      case "Gold":
        return {
          name: translations.gold,
          icon: <Crown className="h-6 w-6 text-amber-500" />,
          description: translations.goldDesc,
          features: [
            translations.accessAll,
            translations.accessAllTopics,
            translations.createUnlimited,
          ],
          color:
            "bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30",
          borderColor: "border-amber-200 dark:border-amber-800",
          iconBg: "bg-amber-100 dark:bg-amber-900/50",
          badge: translations.unlimited,
        };
      default:
        return {
          name: translations.basic,
          icon: <Star className="h-6 w-6 text-gray-500" />,
          description: translations.basicDesc,
          features: [
            translations.limitedAccess,
            translations.viewOnly,
            translations.noIndividual,
          ],
          color:
            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-black",
          borderColor: "border-gray-200 dark:border-gray-800",
          iconBg: "bg-gray-100 dark:bg-gray-900/50",
          badge: null,
        };
    }
  };

  const subscriptionData = getSubscriptionData();

  return (
    <div className="space-y-6 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-4">
        <div className="flex flex-col items-center sm:items-start w-full sm:w-auto order-2 sm:order-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600 text-center sm:text-left">
            {translations.dashboard}
          </h1>
        </div>
        <div className="w-full sm:w-auto order-1 sm:order-2">
          <UserProfile />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ProfileInfo
            firstName={userData?.firstName || "Not set"}
            lastName={userData?.lastName || "Not set"}
            university={userData?.university || "Not set"}
            faculty={userData?.faculty || "Not set"}
            city={userData?.city || "Not set"}
            year={userData?.year || "Not set"}
            reviewScore={userData?.averageRating ?? 0}
            onEdit={() => setShowEditProfile(true)}
          />
          <RatingCard
            averageRating={
              userData?.averageRating !== undefined
                ? userData.averageRating
                : null
            }
            reviewCount={userData?.reviewCount || 0}
            reviews={userData?.reviews || []}
          />
          <UserActivity
            activity={userData?.activity || defaultActivity}
            userPlan={selectedSubscription}
          />
        </div>
        <div className="space-y-6">
          <UserProjects />
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-600">
                {translations.currentPlan}
              </h2>
              {subscriptionData.badge && (
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1 text-xs"
                >
                  {subscriptionData.badge}
                </Badge>
              )}
            </div>

            <Card
              className={`${subscriptionData.color} border ${subscriptionData.borderColor} transition-all duration-200 shadow-md mb-6 overflow-hidden`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <div
                    className={`${subscriptionData.iconBg} p-2 rounded-md mr-3`}
                  >
                    {subscriptionData.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {subscriptionData.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subscriptionData.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {subscriptionData.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4 pb-4">
                <Button
                  onClick={() => router.push("/subscriptions")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center group"
                >
                  <span>{translations.viewAllPlans}</span>
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <PaymentHistory />
      </div>
      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmSubscriptionChange}
        title={translations.changeSubscription}
        message={translations.changeSubscriptionMessage}
      />
      <OnboardingDialog
        isOpen={showOnboarding}
        onClose={() => {
          // Only allow closing if all required information is present
          if (!checkRequiredInformation(userData)) {
            setShowOnboarding(false);
          }
        }}
        onSubmit={async (data) => {
          try {
            const response = await fetch(
              `${window.location.origin}/api/user/onboard`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              }
            );
            if (response.ok) {
              const updatedUser = await response.json();
              setUserData(updatedUser);
              setShowOnboarding(false);
            }
          } catch (error) {
            console.error("Error submitting onboarding data:", error);
          }
        }}
      />
      <EditProfileDialog
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        initialData={userData}
        onSave={async (data: EditProfileFormData) => {
          try {
            const response = await fetch("/api/user", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                firstName: userData?.firstName,
                lastName: userData?.lastName,
                university: data.universityId,
                faculty: data.facultyId,
                city: data.city,
                year: data.year,
              }),
            });
            if (response.ok) {
              const updatedUser = await response.json();
              setUserData({
                ...userData,
                ...updatedUser,
              } as UserData);
              setShowEditProfile(false);
            }
          } catch (error) {
            console.error("Error updating profile:", error);
          }
        }}
      />
    </div>
  );
}
