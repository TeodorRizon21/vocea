"use client";

import { useState, useEffect, useCallback } from "react";
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
          name: "Premium",
          icon: <Shield className="h-6 w-6 text-purple-500" />,
          description: "Acces la funcționalități premium",
          features: [
            "Acces la toate proiectele",
            "Acces la toate topicurile",
            "Creare proiecte (max 4)",
          ],
          color:
            "bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30",
          borderColor: "border-purple-200 dark:border-purple-800",
          iconBg: "bg-purple-100 dark:bg-purple-900/50",
          badge: "Popular",
        };
      case "Gold":
        return {
          name: "Gold",
          icon: <Crown className="h-6 w-6 text-amber-500" />,
          description: "Acces complet, fără limite",
          features: [
            "Acces la toate proiectele",
            "Acces la toate topicurile",
            "Creare proiecte nelimitate",
          ],
          color:
            "bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30",
          borderColor: "border-amber-200 dark:border-amber-800",
          iconBg: "bg-amber-100 dark:bg-amber-900/50",
          badge: "Nelimitat",
        };
      default:
        return {
          name: "Basic",
          icon: <Star className="h-6 w-6 text-gray-500" />,
          description: "Acces la funcționalități de bază",
          features: [
            "Acces limitat",
            "Doar vizualizare listă",
            "Fără acces la conținut individual",
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">Dashboard</h1>
        <UserProfile />
      </div>
      <DashboardHero name={userData?.firstName || "User"} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Planul tău curent
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
                  <span>Vezi toate planurile</span>
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmSubscriptionChange}
        title="Change Subscription"
        message={`Are you sure you want to change your subscription to ${pendingSubscription}?`}
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
