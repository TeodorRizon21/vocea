"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";
import type { Project } from "@prisma/client";
import { useUniversities } from "@/hooks/useUniversities";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";
import { useLanguage } from "@/components/LanguageToggle";

interface ExtendedProject extends Project {
  user: {
    firstName: string | null;
    lastName: string | null;
    university: string | null;
    faculty: string | null;
    avatar: string | null;
  };
  reviews: Array<{ score: number }>;
  studyLevel: string | null;
}

interface ProductGridProps {
  projects: ExtendedProject[];
  userPlan?: string;
}

export default function ProductGrid({
  projects,
  userPlan = "Basic",
}: ProductGridProps) {
  const router = useRouter();
  const { getUniversityName, getFacultyName } = useUniversities();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const { language, forceRefresh } = useLanguage();

  // Translations for dialog with useMemo
  const translations = useMemo(() => {
    return {
      noProjects:
        language === "ro" ? "Niciun proiect găsit." : "No projects found.",
      noUniversity:
        language === "ro"
          ? "Nicio universitate specificată"
          : "No university specified",
      noFaculty:
        language === "ro"
          ? "Nicio facultate specificată"
          : "No faculty specified",
      filterTopics:
        language === "ro" ? "Filtrează subiecte" : "Filter Forum Topics",
      university: language === "ro" ? "Universitate" : "University",
      faculty: language === "ro" ? "Facultate" : "Faculty",
      category: language === "ro" ? "Categorie" : "Category",
      selectUniversity:
        language === "ro" ? "Selectează o universitate" : "Select a university",
      selectFaculty:
        language === "ro" ? "Selectează o facultate" : "Select a faculty",
      selectUniversityFirst:
        language === "ro"
          ? "Selectează mai întâi universitatea"
          : "Select university first",
      selectCategory:
        language === "ro" ? "Selectează o categorie" : "Select a category",
      allUniversities:
        language === "ro" ? "Toate universitățile" : "All Universities",
      allFaculties: language === "ro" ? "Toate facultățile" : "All Faculties",
      allCategories: language === "ro" ? "Toate categoriile" : "All Categories",
      reset: language === "ro" ? "Resetează" : "Reset",
      apply: language === "ro" ? "Aplică" : "Apply Filters",
      general: language === "ro" ? "General" : "General",
      academic: language === "ro" ? "Academic" : "Academic",
      events: language === "ro" ? "Evenimente" : "Events",
      housing: language === "ro" ? "Cazare" : "Housing",
      jobs: language === "ro" ? "Joburi & Stagii" : "Jobs & Internships",
      social: language === "ro" ? "Social" : "Social",
    };
  }, [language, forceRefresh]);

  // Forum categories with translations
  const categories = useMemo(
    () => [
      { id: "general", name: translations.general },
      { id: "academic", name: translations.academic },
      { id: "events", name: translations.events },
      { id: "housing", name: translations.housing },
      { id: "jobs", name: translations.jobs },
      { id: "social", name: translations.social },
    ],
    [translations]
  );

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{translations.noProjects}</p>
      </div>
    );
  }

  const handleProjectClick = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();

    if (userPlan === "Basic") {
      setSelectedProjectId(projectId);
      setShowAccessDenied(true);
      return;
    }

    // For premium plans, navigate to the project page
    router.push(`/project/${projectId}`);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project) => (
          <a
            key={project.id}
            href={`/project/${project.id}`}
            onClick={(e) => handleProjectClick(e, project.id)}
            className="block aspect-square cursor-pointer"
          >
            <ProductCard
              title={project.title}
              subject={project.subject}
              thumbnailUrl={
                project.images[0] || "/placeholder.svg?height=192&width=192"
              }
              authorFirstName={project.user.firstName}
              authorLastName={project.user.lastName}
              authorAvatar={project.user.avatar}
              university={project.university || translations.noUniversity}
              faculty={project.faculty || translations.noFaculty}
              reviews={project.reviews}
              userId={project.userId}
              studyLevel={project.studyLevel || undefined}
            />
          </a>
        ))}
      </div>

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath={`/project/${selectedProjectId}`}
      />
    </>
  );
}
