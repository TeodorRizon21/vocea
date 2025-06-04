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
  avatar?: string | null;
  university?: string;
  faculty?: string;
}

export default function UserProfile({ className }: UserProfileProps) {
  const { isLoaded, user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState("Basic");
  const [loading, setLoading] = useState(true);
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
      subscriptionNames: {
        Basic: "Abonament Basic",
        Bronze: "Abonament Bronz",
        Premium: "Abonament Premium",
        Gold: "Abonament Gold"
      }
    },
    en: {
      universityNotSet: "University not set",
      facultyNotSet: "Faculty not set",
      profileIncomplete: "Profile Incomplete",
      plan: "plan",
      subscriptionNames: {
        Basic: "Basic",
        Bronze: "Bronze",
        Premium: "Premium",
        Gold: "Gold"
      }
    },
  };

  // Selectează traducerile în funcție de limba curentă folosind useMemo
  const t = useMemo(() => {
    return translations[language as keyof typeof translations];
  }, [language, forceRefresh]);

  // Set up useEffect to fetch user data from the API
  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const [userResponse, subscriptionResponse] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/subscription")
        ]);

        if (userResponse.ok) {
          const data = await userResponse.json();
          setUserData(data);
        } else {
          console.error("Failed to fetch user data:", await userResponse.text());
        }

        if (subscriptionResponse.ok) {
          const data = await subscriptionResponse.json();
          setSubscription(data.plan || "Basic");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchData();
    }
  }, [isLoaded, user]);

  // Don't render anything until the component is mounted and Clerk is loaded
  if (!mounted || !isLoaded || loading) {
    return (
      <div className="animate-pulse flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // If no user data is available, show loading state
  if (!userData) {
    return (
      <div className="flex items-center space-x-4">
        <Avatar className="w-12 h-12 border-2 border-purple-600 dark:border-purple-400">
          <AvatarImage src={undefined} alt="" />
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-semibold">Loading...</p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    );
  }

  // Convert IDs to actual names or use direct names
  const universityName = userData?.university 
    ? userData.university.startsWith('uni_') 
      ? getUniversityName(userData.university) 
      : userData.university
    : t.universityNotSet;

  const facultyName = userData?.faculty
    ? userData.faculty.startsWith('fac_')
      ? getFacultyName(userData.university || "", userData.faculty)
      : userData.faculty
    : t.facultyNotSet;

  const initials = userData?.firstName && userData?.lastName
    ? `${userData.firstName[0]}${userData.lastName[0]}`
    : "?";
    
  const displayName = userData?.firstName && userData?.lastName
    ? `${userData.firstName} ${userData.lastName}`
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
        <AvatarImage src={userData?.avatar || undefined} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 flex-1 items-center sm:items-start">
        <p className="font-semibold text-sm md:text-base truncate w-full text-center sm:text-left">{displayName}</p>
        <p
          className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate w-full text-center sm:text-left"
          title={`${facultyName}, ${universityName}`}
        >
          {facultyName && universityName
            ? `${generateAcronym(facultyName)}, ${generateAcronym(universityName)}`
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
          {language === "ro" ? t.subscriptionNames[subscription as keyof typeof t.subscriptionNames] : subscription}
        </Badge>
      </div>
    </div>
  );
}
