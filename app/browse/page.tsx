"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import UserProfile from "@/components/UserProfile";
import BrowsePageClient from "@/components/BrowsePageClient";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "proiect";
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [originalPath, setOriginalPath] = useState("");
  const [userPlan, setUserPlan] = useState("Basic");
  const { user, isLoaded } = useUser();
  const { language, forceRefresh } = useLanguage();
  const router = useRouter();

  // Traduceri pentru pagina cu useMemo
  const translations = useMemo(() => {
    return {
      browseTitle: {
        proiect: language === "ro" ? "Proiecte Academice" : "Academic Projects",
        cerere: language === "ro" ? "Cereri de Proiecte" : "Project Requests",
        diverse: language === "ro" ? "Anunțuri Diverse" : "Various Announcements",
      },
      projects: language === "ro" ? "Proiecte" : "Projects",
      projectRequests:
        language === "ro" ? "Cereri de proiecte" : "Project requests",
      diverse: language === "ro" ? "Diverse" : "Diverse",
      projectsDescription:
        language === "ro"
          ? "Explorează proiecte în curs și oportunități de colaborare."
          : "Explore ongoing projects and opportunities for collaboration.",
      projectRequestsDescription:
        language === "ro"
          ? "Răsfoiește cereri de proiecte și găsește modalități de a contribui cu aptitudinile tale."
          : "Browse project requests and find ways to contribute your skills.",
      diverseDescription:
        language === "ro"
          ? "Descoperă o varietate de alte oportunități și resurse."
          : "Discover a variety of other opportunities and resources.",
    };
  }, [language, forceRefresh]);

  const tabsData = useMemo(
    () => [
      {
        id: "proiect",
        label: translations.projects,
        description: translations.projectsDescription,
      },
      {
        id: "cerere",
        label: translations.projectRequests,
        description: translations.projectRequestsDescription,
      },
      {
        id: "diverse",
        label: translations.diverse,
        description: translations.diverseDescription,
      },
    ],
    [translations]
  );

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (user?.id) {
        try {
          const response = await fetch("/api/user");
          if (response.ok) {
            const userData = await response.json();
            setUserPlan(userData.planType || "Basic");
          }
        } catch (error) {
          console.error("Error fetching user plan:", error);
        }
      }
    };

    if (isLoaded) {
      fetchUserPlan();
    }
  }, [user, isLoaded]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/projects?type=${activeTab}`);

        if (!response.ok) {
          if (response.status === 403) {
            // Access denied response
            const data = await response.json();
            setOriginalPath(data.originalPath || "/");
            setShowAccessDenied(true);
          } else {
            console.error("Failed to fetch projects:", await response.text());
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [activeTab]);

  return (
    <div className="space-y-6 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-4">
        <div className="flex flex-col items-center sm:items-start w-full sm:w-auto order-2 sm:order-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600 text-center sm:text-left">
            {translations.browseTitle[activeTab as keyof typeof translations.browseTitle]}
          </h1>
          <Button
            onClick={() => {
              if (userPlan === "Basic") {
                setShowAccessDenied(true);
                return;
              }
              router.push("/projects/new");
            }}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto md:hidden"
          >
            {activeTab === "proiect"
              ? (language === "ro" ? "Adaugă un proiect nou" : "Add a new project")
              : activeTab === "cerere"
              ? (language === "ro" ? "Adaugă o cerere de proiect" : "Add a project request")
              : (language === "ro" ? "Adaugă un anunț nou" : "Add a new announcement")
            }
          </Button>
        </div>
        <div className="w-full sm:w-auto order-1 sm:order-2">
          <UserProfile />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <BrowsePageClient
          tabsData={tabsData}
          initialTab={activeTab}
          projects={projects}
          userPlan={userPlan}
        />
      )}

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath={originalPath}
      />
    </div>
  );
}
