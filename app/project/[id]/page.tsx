"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ProjectDetails from "@/components/ProjectDetails";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";
import { useLanguage } from "@/components/LanguageToggle";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru pagina
  const translations = useMemo(() => {
    return {
      loading: language === "ro" ? "Se încarcă..." : "Loading...",
      error: language === "ro" ? "Eroare" : "Error",
      projectNotFound:
        language === "ro" ? "Proiectul nu a fost găsit" : "Project not found",
      back: language === "ro" ? "Înapoi" : "Back",
      fetchError:
        language === "ro"
          ? "A apărut o eroare la încărcarea proiectului"
          : "Failed to fetch project",
    };
  }, [language, forceRefresh]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`);

        if (response.status === 403) {
          // Access denied response - user doesn't have permission
          setShowAccessDenied(true);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.status}`);
        }

        const data = await response.json();
        setProject(data);
      } catch (error: any) {
        console.error("Error fetching project:", error);
        setError(error.message || translations.fetchError);
      } finally {
        setLoading(false);
      }
    };

    // Verifică planul utilizatorului direct
    const checkUserPlan = async () => {
      try {
        const response = await fetch(`/api/user`);
        if (response.ok) {
          const userData = await response.json();
          // Verifică dacă utilizatorul are plan Basic și afișează dialogul dacă este cazul
          if (userData.planType === "Basic") {
            setShowAccessDenied(true);
            setLoading(false);
            return true; // Returnează true dacă utilizatorul are plan Basic
          }
        }
        return false;
      } catch (error) {
        console.error("Error fetching user plan:", error);
        return false;
      }
    };

    const initPage = async () => {
      if (params?.id) {
        // Verifică mai întâi planul, dacă e Basic, nu mai face fetch pentru proiect
        const isBasicPlan = await checkUserPlan();
        if (!isBasicPlan) {
          fetchProject();
        }
      }
    };

    initPage();
  }, [params?.id, translations.fetchError]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{translations.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          {translations.error}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          {translations.back}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAccessDenied ? null : project ? (
        <ProjectDetails project={project} />
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">Project not found</p>
        </div>
      )}

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath={`/project/${params.id}`}
      />
    </div>
  );
}
