"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import TabsSection from "@/components/TabsSection";
import SearchBar from "@/components/SearchBar";
import SortButton from "@/components/SortButton";
import FilterButton from "@/components/FilterButton";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import FilterDialog from "@/components/FilterDialog";
import { useUniversities } from "@/hooks/useUniversities";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/components/LanguageToggle";
import ProductCard from "@/components/ProductCard";
import UserProfile from "@/components/UserProfile";

// Import the ExtendedProject type from ProductGrid
interface ExtendedProject {
  id: string;
  type: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  university: string;
  faculty: string;
  phoneNumber: string;
  images: string[];
  userId: string;
  authorName: string | null;
  authorAvatar: string | null;
  studyLevel: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    firstName: string | null;
    lastName: string | null;
    university: string | null;
    faculty: string | null;
    avatar: string | null;
  };
  reviews: Array<{ score: number }>;
}

interface BrowsePageClientProps {
  projects: ExtendedProject[];
  tabsData: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  initialTab: string;
  userPlan?: string;
}

// Diverse subcategories
const diverseSubcategories = [
  { id: "all", label: "All" },
  { id: "oferte-munca", label: "Oferte muncă" },
  { id: "servicii", label: "Servicii" },
  { id: "autoturisme", label: "Autoturisme" },
  { id: "sport", label: "Sport" },
  { id: "electronice", label: "Electronice" },
  { id: "cosmetice", label: "Cosmetice" },
  { id: "electrocasnice", label: "Electrocasnice" },
  { id: "manuale-carti", label: "Manuale / Carti" },
  { id: "altele", label: "Altele" },
];

export default function BrowsePageClient({
  projects,
  tabsData,
  initialTab,
  userPlan = "Basic",
}: BrowsePageClientProps) {
  const router = useRouter();
  const { getUniversityName, getFacultyName } = useUniversities();
  const { isLoaded, user } = useUser();
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru pagina cu useMemo
  const translations = useMemo(() => {
    return {
      addNewProject:
        language === "ro" ? "Adaugă un proiect nou" : "Add a new project",
      all: language === "ro" ? "Toate" : "All",
      jobOffers: language === "ro" ? "Oferte muncă" : "Job offers",
      objects: language === "ro" ? "Obiecte" : "Objects",
      services: language === "ro" ? "Servicii" : "Services",
      manuals: language === "ro" ? "Manuale / Carti" : "Manuals / Books",
      noResults:
        language === "ro"
          ? "Nu au fost găsite proiecte care să corespundă criteriilor tale de căutare. Încearcă să schimbi criteriile de căutare sau filtrare."
          : "No projects found matching your search criteria. Try changing your search or filter criteria.",
      loadingMore:
        language === "ro"
          ? "Se încarcă mai multe proiecte..."
          : "Loading more projects...",
    };
  }, [language, forceRefresh]);

  // Traducerea subcategoriilor diverse
  const translatedSubcategories = useMemo(
    () => [
      { id: "all", label: translations.all },
      { id: "oferte-munca", label: translations.jobOffers },
      { id: "servicii", label: translations.services },
      { id: "autoturisme", label: language === "ro" ? "Autoturisme" : "Cars" },
      { id: "sport", label: language === "ro" ? "Sport" : "Sport" },
      { id: "electronice", label: language === "ro" ? "Electronice" : "Electronics" },
      { id: "cosmetice", label: language === "ro" ? "Cosmetice" : "Cosmetics" },
      { id: "electrocasnice", label: language === "ro" ? "Electrocasnice" : "Home Appliances" },
      { id: "manuale-carti", label: translations.manuals },
      { id: "altele", label: language === "ro" ? "Altele" : "Other" },
    ],
    [translations, language]
  );

  // State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [diverseSubcategory, setDiverseSubcategory] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState<ExtendedProject[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    university: "",
    faculty: "",
    category: "",
    studyLevel: "",
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Filter projects when tab, search, or filters change
  useEffect(() => {
    // First filter by tab
    let result = projects.filter((project) => project.type === activeTab);

    // Then apply subcategory filter for diverse items
    if (activeTab === "diverse" && diverseSubcategory !== "all") {
      result = result.filter(
        (project) => project.category === diverseSubcategory
      );
    }

    // Then apply search filter if needed
    if (searchQuery) {
      result = result.filter((project) => {
        const searchString = `${project.title} ${project.description} ${
          project.subject
        } ${project.university || ""} ${project.faculty || ""}`.toLowerCase();
        return searchString.includes(searchQuery.toLowerCase());
      });
    }

    // Then apply university filter if needed
    if (filters.university) {
      const universityName = getUniversityName(filters.university);
      result = result.filter(
        (project) =>
          project.university && project.university.includes(universityName)
      );
    }

    // Then apply faculty filter if needed
    if (filters.university && filters.faculty) {
      const facultyName = getFacultyName(filters.university, filters.faculty);
      result = result.filter(
        (project) => project.faculty && project.faculty.includes(facultyName)
      );
    }

    // Apply category filter if needed
    if (filters.category && filters.category !== "_all") {
      result = result.filter(
        (project) => 
          (project.category && project.category === filters.category) || 
          (project.subject && project.subject === filters.category)
      );
    }

    // Apply study level filter if needed
    if (filters.studyLevel && filters.studyLevel !== "_all") {
      result = result.filter(
        (project) => project.studyLevel === filters.studyLevel
      );
    }

    // Apply sort order
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    // Update state with filtered projects
    setFilteredProjects(result);
  }, [
    activeTab,
    diverseSubcategory,
    projects,
    searchQuery,
    filters,
    sortOrder,
  ]);

  // Handlers
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setDiverseSubcategory("all"); // Reset subcategory when changing tabs
    
    // Reset category and study level filters when switching tabs, especially to diverse
    if (value === "diverse") {
      setFilters(prev => ({
        ...prev,
        category: "",
        studyLevel: ""
      }));
    } else {
      // Just reset the category to ensure it's appropriate for the new tab
      setFilters(prev => ({
        ...prev,
        category: ""
      }));
    }
    
    router.push(`/browse?tab=${value}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const handleFilter = () => {
    setIsFilterDialogOpen(true);
  };

  const handleApplyFilters = (newFilters: {
    university: string;
    faculty: string;
    category: string;
    studyLevel: string;
  }) => {
    setFilters(newFilters);
  };

  const handleNewProjectClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Verifică dacă utilizatorul are un plan Basic
    if (userPlan === "Basic") {
      setShowAccessDenied(true);
      return;
    }

    // Altfel, redirectează către pagina de creare proiect
    router.push("/projects/new");
  };

  const handleProjectClick = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();

    // Verifică dacă utilizatorul are un plan Basic
    if (userPlan === "Basic") {
      setShowAccessDenied(true);
      return;
    }

    // Altfel, redirectează către pagina proiectului
    router.push(`/project/${projectId}`);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <TabsSection
            tabs={tabsData}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto text-sm md:text-base"
          onClick={handleNewProjectClick}
        >
          {translations.addNewProject}
        </Button>
      </div>

      <HeroSection
        title={tabsData.find((tab) => tab.id === activeTab)?.label || ""}
        description={
          tabsData.find((tab) => tab.id === activeTab)?.description || ""
        }
      />

      {/* Show subcategories only for diverse tab */}
      {activeTab === "diverse" && (
        <div className="flex flex-wrap gap-2 my-4 overflow-x-auto pb-2">
          {translatedSubcategories.map((subcategory) => (
            <Button
              key={subcategory.id}
              variant={
                diverseSubcategory === subcategory.id ? "default" : "outline"
              }
              className={`whitespace-nowrap text-xs md:text-sm ${
                diverseSubcategory === subcategory.id
                  ? "bg-purple-600 hover:bg-purple-700"
                  : ""
              }`}
              onClick={() => setDiverseSubcategory(subcategory.id)}
            >
              {subcategory.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-grow">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="flex space-x-4">
          <SortButton onSort={handleSort} />
          <FilterButton
            onFilter={handleFilter}
            activeFiltersCount={activeFiltersCount}
          />
        </div>
      </div>

      <div className="mt-6">
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <a
                key={project.id}
                href={`/project/${project.id}`}
                onClick={(e) => handleProjectClick(e, project.id)}
                className="block cursor-pointer"
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
                  university={
                    project.university || "Nicio universitate specificată"
                  }
                  faculty={project.faculty || "Nicio facultate specificată"}
                  category={project.category || project.subject}
                  reviews={project.reviews}
                  userId={project.userId}
                  studyLevel={project.studyLevel || undefined}
                />
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm md:text-base">
              {translations.noResults}
            </p>
          </div>
        )}
      </div>

      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        showCategoryFilter={activeTab !== "diverse"}
      />

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath="/projects/new"
      />
    </>
  );
}
