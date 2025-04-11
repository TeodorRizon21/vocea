"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import UserProfile from "@/components/UserProfile";
import BrowsePageClient from "@/components/BrowsePageClient";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";
import { useUser } from "@clerk/nextjs";

const tabsData = [
  {
    id: "proiect",
    label: "Proiecte",
    description:
      "Explore ongoing projects and opportunities for collaboration.",
  },
  {
    id: "cerere",
    label: "Cereri de proiecte",
    description:
      "Browse project requests and find ways to contribute your skills.",
  },
  {
    id: "diverse",
    label: "Diverse",
    description: "Discover a variety of other opportunities and resources.",
  },
];

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "proiect";
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [originalPath, setOriginalPath] = useState("");
  const [userPlan, setUserPlan] = useState("Basic");
  const { user, isLoaded } = useUser();

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">Browse projects</h1>
        <UserProfile />
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
