"use client";

import { useState, useEffect } from "react";
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
  { id: "obiecte", label: "Obiecte" },
  { id: "servicii", label: "Servicii" },
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

  return (
    <>
      <div className="flex justify-between items-center">
        <TabsSection
          tabs={tabsData}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={handleNewProjectClick}
        >
          Add a new project
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
        <div className="flex flex-wrap gap-2 my-4">
          {diverseSubcategories.map((subcategory) => (
            <Button
              key={subcategory.id}
              variant={
                diverseSubcategory === subcategory.id ? "default" : "outline"
              }
              className={
                diverseSubcategory === subcategory.id
                  ? "bg-purple-600 hover:bg-purple-700"
                  : ""
              }
              onClick={() => setDiverseSubcategory(subcategory.id)}
            >
              {subcategory.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="flex-grow">
          <SearchBar onSearch={handleSearch} />
        </div>
        <SortButton onSort={handleSort} />
        <FilterButton
          onFilter={handleFilter}
          activeFiltersCount={activeFiltersCount}
        />
      </div>

      <div className="mt-6">
        {filteredProjects.length > 0 ? (
          <ProductGrid projects={filteredProjects} userPlan={userPlan} />
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">
              No projects found matching your criteria.
            </p>
          </div>
        )}
      </div>

      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath="/projects/new"
      />
    </>
  );
}
