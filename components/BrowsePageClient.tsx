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
import { DIVERSE_CATEGORIES } from "@/lib/constants";

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
  city?: string | null;
  academicYear?: string | null;
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

// Diverse subcategories (reordered and without job offers and services)
const diverseSubcategories = [
  { id: "all", label: "All" },
  ...DIVERSE_CATEGORIES.filter(cat => cat.id !== "oferte-munca" && cat.id !== "servicii")
];



// New Joburi/Servicii subcategories - extract from DIVERSE_CATEGORIES
const joburiServiciiSubcategories = [
  { id: "all", label: "All" },
  ...DIVERSE_CATEGORIES.filter(cat => cat.id === "oferte-munca" || cat.id === "servicii")
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

  // Ensure all projects have a city property
  const safeProjects = useMemo(() => projects.map(p => ({ ...p, city: p.city ?? '' })), [projects]);

  // Traduceri pentru pagina cu useMemo
  const translations = useMemo(() => {
    return {
      addNewProject:
        language === "ro" ? "Adaugă un proiect nou" : "Add a new project",
      addNewRequest:
        language === "ro" ? "Adaugă o cerere de proiect" : "Add a project request",
      addNewAnnouncement:
        language === "ro" ? "Adaugă un anunț nou" : "Add a new announcement",
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
      // New commercial descriptions
      projectsDescription:
        language === "ro"
          ? "Descoperă proiecte gata de implementare pentru studenți. Perfecte pentru proiectele tale de licență, master sau doctorat. Găsește inspirație și modele pentru a-ți îmbunătăți notele și a-ți construi un portofoliu impresionant."
          : "Discover ready-to-implement projects for students. Perfect for your bachelor's, master's, or PhD projects. Find inspiration and templates to improve your grades and build an impressive portfolio.",
      projectRequestsDescription:
        language === "ro"
          ? "Ești student și ai nevoie de ajutor cu proiectul tău? Publică cererea ta și găsește alți studenți sau profesori care te pot ajuta. Ideal pentru proiecte de licență, master sau doctorat, cu suport personalizat pentru nevoile tale academice."
          : "Are you a student needing help with your project? Post your request and find other students or professors who can help. Ideal for bachelor's, master's, or PhD projects, with personalized support for your academic needs.",
      diverseDescription:
        language === "ro"
          ? "Tot ce ai nevoie ca student: cărți și materiale de studiu, electronice, electrocasnice, autoturisme, sport, cosmetice și multe altele. O platformă dedicată exclusiv pentru studenți, cu tot ce necesită succesul tău academic."
          : "Everything you need as a student: books and study materials, electronics, home appliances, cars, sports, cosmetics and more. A platform dedicated exclusively to students, with everything required for your academic success.",
      joburiServiciiDescription:
        language === "ro"
          ? "Oportunități profesionale și servicii pentru studenți: oferte de muncă part-time, internship-uri, servicii de mentoring, consultanță academică și multe altele. Construiește-ți cariera și dezvoltă-ți abilitățile cu ajutorul comunității noastre."
          : "Professional opportunities and services for students: part-time job offers, internships, mentoring services, academic consulting and more. Build your career and develop your skills with the help of our community.",
      projectsTitle:
        language === "ro" ? "Proiecte Academice" : "Academic Projects",
      projectRequestsTitle:
        language === "ro" ? "Cereri de Proiecte" : "Project Requests",
      diverseTitle:
        language === "ro" ? "Anunțuri Diverse" : "Various Announcements",
      joburiServiciiTitle:
        language === "ro" ? "Joburi / Servicii" : "Jobs / Services",
    };
  }, [language, forceRefresh]);

  // Traducerea subcategoriilor diverse (reordered)
  const translatedSubcategories = useMemo(
    () => [
      { id: "all", label: translations.all },
      ...DIVERSE_CATEGORIES.filter(cat => cat.id !== "oferte-munca" && cat.id !== "servicii")
        .map(cat => ({
          id: cat.id,
          label: cat.label
        }))
    ],
    [translations]
  );

  // Traducerea subcategoriilor Joburi/Servicii
  const translatedJoburiServiciiSubcategories = useMemo(
    () => [
      { id: "all", label: translations.all },
      ...DIVERSE_CATEGORIES.filter(cat => cat.id === "oferte-munca" || cat.id === "servicii")
        .map(cat => ({
          id: cat.id,
          label: cat.label
        }))
    ],
    [translations]
  );

  // State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [diverseSubcategory, setDiverseSubcategory] = useState("all");
  const [joburiServiciiSubcategory, setJoburiServiciiSubcategory] = useState("all");
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
    city: "",
    academicYear: "",
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Filter projects when tab, search, or filters change
  useEffect(() => {
    console.log("Starting filtering with:", {
      activeTab,
      filters,
      projectsCount: safeProjects.length
    });

    // First filter by tab
    let result = safeProjects.filter((project) => {
      if (activeTab === "joburi-servicii") {
        // Pentru joburi-servicii, include proiecte cu tipul "diverse" dar cu categoriile oferte-munca sau servicii
        return project.type === "diverse" && 
               (project.category === "oferte-munca" || project.category === "servicii");
      }
      return project.type === activeTab;
    });
    console.log("After tab filter:", result.length, "projects");

    // Then apply subcategory filter for diverse items
    if (activeTab === "diverse" && diverseSubcategory !== "all") {
      result = result.filter(
        (project) => project.category === diverseSubcategory
      );
      console.log("After diverse subcategory filter:", result.length, "projects");
    }

    // Then apply subcategory filter for joburi/servicii items
    if (activeTab === "joburi-servicii" && joburiServiciiSubcategory !== "all") {
      result = result.filter(
        (project) => project.category === joburiServiciiSubcategory
      );
      console.log("After joburi/servicii subcategory filter:", result.length, "projects");
    }

    // Then apply search filter if needed
    if (searchQuery) {
      result = result.filter((project) => {
        const searchString = `${project.title} ${project.description} ${
          project.subject
        } ${project.university || ""} ${project.faculty || ""} ${project.city || ""}`.toLowerCase();
        return searchString.includes(searchQuery.toLowerCase());
      });
      console.log("After search filter:", result.length, "projects");
    }

    // Then apply university filter if needed
    if (filters.university) {
      // Only apply university filter for proiect and cerere tabs
      if (activeTab === "proiect" || activeTab === "cerere") {
        const universityName = getUniversityName(filters.university);
        result = result.filter(
          (project) =>
            project.university && project.university === universityName
        );
        console.log("After university filter:", result.length, "projects");
      }
    }

    // Then apply faculty filter if needed
    if (filters.university && filters.faculty) {
      // Only apply faculty filter for proiect and cerere tabs
      if (activeTab === "proiect" || activeTab === "cerere") {
        const facultyName = getFacultyName(filters.university, filters.faculty);
        result = result.filter(
          (project) => project.faculty && project.faculty === facultyName
        );
        console.log("After faculty filter:", result.length, "projects");
      }
    }

    // Apply city filter if needed
    if (filters.city && filters.city !== "_all") {
      // Only apply city filter for diverse or joburi-servicii tabs
      if (activeTab === "diverse" || activeTab === "joburi-servicii") {
        result = result.filter((project) => {
          const projectCity = (project.city || "").trim().toLowerCase();
          const filterCity = filters.city.trim().toLowerCase();
          return projectCity === filterCity;
        });
        console.log("After city filter:", result.length, "projects");
      }
    }

    // Apply category filter if needed
    if (filters.category) {
      // Only apply category filter for proiect and cerere tabs
      if (activeTab === "proiect" || activeTab === "cerere") {
        result = result.filter(
          (project) => 
            (project.category && project.category === filters.category) || 
            (project.subject && project.subject === filters.category)
        );
        console.log("After category filter:", result.length, "projects");
      }
    }

    // Apply study level filter if needed
    if (filters.studyLevel) {
      // Only apply study level filter for proiect and cerere tabs
      if (activeTab === "proiect" || activeTab === "cerere") {
        result = result.filter(
          (project) => project.studyLevel === filters.studyLevel
        );
        console.log("After study level filter:", result.length, "projects");
      }
    }

    // Apply academic year filter if needed
    if (filters.academicYear && filters.academicYear !== "_all") {
      // Only apply academic year filter for diverse (manuale-carti) or joburi-servicii (manuale-carti)
      if ((activeTab === "diverse" && diverseSubcategory === "manuale-carti") || 
          (activeTab === "joburi-servicii" && joburiServiciiSubcategory === "manuale-carti")) {
        result = result.filter(
          (project) => project.academicYear === filters.academicYear
        );
        console.log("After academic year filter:", result.length, "projects");
      }
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
    joburiServiciiSubcategory,
    safeProjects,
    searchQuery,
    filters,
    sortOrder,
  ]);

  // Handlers
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setDiverseSubcategory("all"); // Reset subcategory when changing tabs
    setJoburiServiciiSubcategory("all"); // Reset joburi/servicii subcategory when changing tabs
    setSearchQuery(""); // Reset search when changing tabs
    setFilters({
      university: "",
      faculty: "",
      category: "",
      studyLevel: "",
      city: "",
      academicYear: "",
    }); // Reset filters when changing tabs
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
    city: string;
    academicYear: string;
  }) => {
    // Convert "_all" to empty strings for cleaner filtering
    const cleanFilters = {
      university: newFilters.university === "_all" ? "" : newFilters.university,
      faculty: newFilters.faculty === "_all" ? "" : newFilters.faculty,
      category: newFilters.category === "_all" ? "" : newFilters.category,
      studyLevel: newFilters.studyLevel === "_all" ? "" : newFilters.studyLevel,
      city: newFilters.city === "_all" ? "" : newFilters.city,
      academicYear: newFilters.academicYear === "_all" ? "" : newFilters.academicYear,
    };
    setFilters(cleanFilters);
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

  // Get the appropriate button text based on the active tab
  const getAddButtonText = () => {
    switch (activeTab) {
      case "proiect":
        return translations.addNewProject;
      case "cerere":
        return translations.addNewRequest;
      case "diverse":
        return translations.addNewAnnouncement;
      case "joburi-servicii":
        return translations.addNewAnnouncement;
      default:
        return translations.addNewProject;
    }
  };

  // Get unique cities from projects
  const projectCities = useMemo(() => {
    return safeProjects
      .map(project => project.city)
      .filter((city): city is string => Boolean(city));
  }, [safeProjects]);

  return (
    <>
      {/* Description section with new layout */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white p-8 rounded-lg">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              <p className="text-base md:text-lg lg:text-xl">
            {activeTab === "proiect" && translations.projectsDescription}
            {activeTab === "cerere" && translations.projectRequestsDescription}
            {activeTab === "diverse" && translations.diverseDescription}
            {activeTab === "joburi-servicii" && translations.joburiServiciiDescription}
          </p>
              <div className="pt-4 border-t border-white/20">
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm md:text-base">
                  {activeTab === "proiect" && (
                    <>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Proiecte verificate" : "Verified projects"}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Suport academic" : "Academic support"}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Resurse de calitate" : "Quality resources"}
                      </li>
                    </>
                  )}
                  {activeTab === "cerere" && (
                    <>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Asistență personalizată" : "Personalized assistance"}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Experți verificați" : "Verified experts"}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Răspuns rapid" : "Quick response"}
                      </li>
                    </>
                  )}
                  {activeTab === "diverse" && (
                    <>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Oportunități diverse" : "Various opportunities"}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Comunitate activă" : "Active community"}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Anunțuri verificate" : "Verified announcements"}
                      </li>
                    </>
                  )}
                  {activeTab === "joburi-servicii" && (
                    <>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Oportunități profesionale" : "Professional opportunities"}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Servicii verificate" : "Verified services"}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === "ro" ? "Dezvoltare carieră" : "Career development"}
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <TabsSection
            tabs={tabsData}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto text-sm md:text-base hidden md:block"
          onClick={handleNewProjectClick}
        >
          {getAddButtonText()}
        </Button>
      </div>

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

      {/* Show subcategories for joburi/servicii tab */}
      {activeTab === "joburi-servicii" && (
        <div className="flex flex-wrap gap-2 my-4 overflow-x-auto pb-2">
          {translatedJoburiServiciiSubcategories.map((subcategory) => (
            <Button
              key={subcategory.id}
              variant={
                joburiServiciiSubcategory === subcategory.id ? "default" : "outline"
              }
              className={`whitespace-nowrap text-xs md:text-sm ${
                joburiServiciiSubcategory === subcategory.id
                  ? "bg-purple-600 hover:bg-purple-700"
                  : ""
              }`}
              onClick={() => setJoburiServiciiSubcategory(subcategory.id)}
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
                  type={project.type}
                  city={project.city || undefined}
                  academicYear={project.academicYear || undefined}
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
        showCategoryFilter={activeTab !== "diverse" && activeTab !== "joburi-servicii"}
        showCityFilter={activeTab === "diverse" || activeTab === "joburi-servicii"}
        showAcademicYearFilter={(activeTab === "diverse" && diverseSubcategory === "manuale-carti") || (activeTab === "joburi-servicii" && joburiServiciiSubcategory === "manuale-carti")}
        showStudyLevelFilter={activeTab !== "diverse" && activeTab !== "joburi-servicii"}
      />

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath="/projects/new"
      />
    </>
  );
}
