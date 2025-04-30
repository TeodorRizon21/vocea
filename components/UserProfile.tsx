"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { generateAcronym } from "@/lib/acronym";
import { useUniversities } from "@/hooks/useUniversities";
import { useLanguage } from "@/components/LanguageToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";


interface UserProfileProps {
  className?: string;
}

interface UserData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  university?: string;
  faculty?: string;
}

export default function UserProfile({ className }: UserProfileProps) {
  const { isLoaded, user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState("Basic");
  const [error, setError] = useState(false);
  const router = useRouter();
  const { getUniversityName, getFacultyName } = useUniversities();
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru texte statice
  const translations = {
    ro: {
      universityNotSet: "Universitate nesetată",
      facultyNotSet: "Facultate nesetată",
      profileIncomplete: "Profil incomplet",
      plan: "abonament",
    },
    en: {
      universityNotSet: "University not set",
      facultyNotSet: "Faculty not set",
      profileIncomplete: "Profile Incomplete",
      plan: "plan",
    },
  };

  // Selectează traducerile în funcție de limba curentă folosind useMemo
  const t = useMemo(() => {
    return translations[language as keyof typeof translations];
  }, [language, forceRefresh]);

  // Set up useEffect to fetch user data from the API
  useEffect(() => {
    setMounted(true);

    // Fetch user data from your API
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          // If API returns an error, use Clerk data as fallback
          if (user) {
            setUserData({
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              avatar: user.imageUrl || undefined,
              university: t.universityNotSet,
              faculty: t.facultyNotSet,
            });
          }
          setError(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(true);
        // Use Clerk data as fallback
        if (user) {
          setUserData({
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            avatar: user.imageUrl || undefined,
            university: t.universityNotSet,
            faculty: t.facultyNotSet,
          });
        }
      }
    };

    // Fetch subscription data
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/subscription");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.plan || "Basic");
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    };

    fetchUserData();
    fetchSubscription();
  }, [user, t]);

  // Don't render anything until the component is mounted and Clerk is loaded
  if (!mounted || !isLoaded) {
    return null;
  }

  // If no user data is available, show the last available user data instead of "Guest User"
  const displayUserData = userData || {
    firstName: user?.firstName,
    lastName: user?.lastName,
    avatar: user?.imageUrl,
    university: t.universityNotSet,
    faculty: t.facultyNotSet,
  };

  // Convert IDs to actual names
  const universityName =
    displayUserData.university &&
    displayUserData.university !== t.universityNotSet
      ? getUniversityName(displayUserData.university)
      : t.universityNotSet;

  const facultyName =
    displayUserData.faculty && displayUserData.faculty !== t.facultyNotSet
      ? getFacultyName(
          displayUserData.university || "",
          displayUserData.faculty
        )
      : t.facultyNotSet;

  const initials =
    displayUserData.firstName && displayUserData.lastName
      ? `${displayUserData.firstName[0]}${displayUserData.lastName[0]}`
      : "?";
  const displayName =
    displayUserData.firstName && displayUserData.lastName
      ? `${displayUserData.firstName} ${displayUserData.lastName}`
      : t.profileIncomplete;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4 ${className} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1.5 md:p-2 transition duration-200 ease-in-out min-w-0`}
      onClick={() => router.push("/dashboard")}
      role="button"
      tabIndex={0}
      aria-label="Go to dashboard"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push("/dashboard");
        }
      }}
    >
      <Avatar className="w-12 h-12 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 border-2 border-purple-600 dark:border-purple-400 flex-shrink-0">
        <AvatarImage src={displayUserData.avatar} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 flex-1 items-center sm:items-start">
        <p className="font-semibold text-sm md:text-base truncate w-full text-center sm:text-left">{displayName}</p>
        <p
          className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate w-full text-center sm:text-left"
          title={
            facultyName && universityName
              ? `${facultyName}, ${universityName}`
              : t.universityNotSet
          }
        >
          {facultyName && universityName
            ? `${generateAcronym(facultyName)}, ${generateAcronym(
                universityName
              )}`
            : t.universityNotSet}
        </p>
        <Badge
          variant="secondary"
          className={`mt-0.5 md:mt-1 text-xs ${
            subscription === "Basic"
              ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              : subscription === "Premium"
              ? "bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200"
              : subscription === "Gold"
              ? "bg-yellow-200 text-yellow-800"
              : ""
          }`}
        >
          {subscription} {t.plan}
        </Badge>
      </div>
    </div>
  );
}
