"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import TabsSection from "@/components/TabsSection"
import SearchBar from "@/components/SearchBar"
import SortButton from "@/components/SortButton"
import FilterButton from "@/components/FilterButton"
import { Button } from "@/components/ui/button"
import HeroSection from "@/components/HeroSection"
import ProductGrid from "@/components/ProductGrid"
import FilterDialog from "@/components/FilterDialog"
import { useUniversities } from "@/hooks/useUniversities"
import { ACADEMIC_CATEGORIES } from "@/lib/constants"

// Import the ExtendedProject type from ProductGrid
interface ExtendedProject {
  id: string
  type: string
  title: string
  description: string
  subject: string
  category: string
  university: string
  faculty: string
  phoneNumber: string
  images: string[]
  userId: string
  authorName: string | null
  authorAvatar: string | null
  createdAt: Date
  updatedAt: Date
  user: {
    firstName: string | null
    lastName: string | null
    university: string | null
    faculty: string | null
    avatar: string | null
  }
  reviews: Array<{ score: number }>
}

interface BrowsePageClientProps {
  projects: ExtendedProject[]
  tabsData: Array<{
    id: string
    label: string
    description: string
  }>
  initialTab: string
}

// Diverse subcategories
const diverseSubcategories = [
  { id: "all", label: "All" },
  { id: "oferte-munca", label: "Oferte muncă" },
  { id: "obiecte", label: "Obiecte" },
  { id: "servicii", label: "Servicii" },
]

export default function BrowsePageClient({ projects, tabsData, initialTab }: BrowsePageClientProps) {
  const router = useRouter()
  const { getUniversityName, getFacultyName } = useUniversities()

  // State
  const [activeTab, setActiveTab] = useState(initialTab)
  const [diverseSubcategory, setDiverseSubcategory] = useState("all")
  const [filteredProjects, setFilteredProjects] = useState<ExtendedProject[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    university: "_all",
    faculty: "_all",
    category: "_all",
  })
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Determine if category filter should be shown (only for proiect and cerere tabs)
  const showCategoryFilter = activeTab === "proiect" || activeTab === "cerere"

  // Count active filters (excluding _all values)
  const activeFiltersCount = Object.entries(filters)
    .filter(([key, value]) => value !== "_all" && 
      // Only count category if it's being shown
      (key !== "category" || showCategoryFilter))
    .length

  // Filter projects based on active tab, diverse subcategory, search query, and filters
  useEffect(() => {
    // Make sure projects is an array before proceeding
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      setFilteredProjects([]);
      return;
    }

    let filtered = [...projects];
    
    // Debug logging
    console.log('Filtering projects...');
    console.log('Current filters:', filters);
    
    if (filtered.length > 0) {
      const sampleProject = filtered[0];
      console.log('Sample project for filtering:', {
        id: sampleProject.id,
        title: sampleProject.title,
        type: sampleProject.type,
        university: sampleProject.university,
        faculty: sampleProject.faculty,
        subject: sampleProject.subject,
        category: sampleProject.category,
        user: {
          university: sampleProject.user?.university,
          faculty: sampleProject.user?.faculty
        }
      });
    }

    // Step 1: First filter by project type (proiect, cerere, diverse)
    if (activeTab !== 'diverse') {
      // If not diverse, filter by project type
      filtered = filtered.filter(project => project.type === activeTab);
    } else {
      // If diverse tab, only show projects with type='diverse'
      filtered = filtered.filter(project => project.type === 'diverse');
      
      // Then apply the diverse subcategory filter if needed
      if (diverseSubcategory !== 'all') {
        filtered = filtered.filter(project => project.category === diverseSubcategory);
      }
    }

    console.log(`After tab filtering (${activeTab}): ${filtered.length} projects remain`);

    // Filter by search query
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(project => {
        return (
          project.title.toLowerCase().includes(lowercaseQuery) ||
          (project.description && project.description.toLowerCase().includes(lowercaseQuery))
        );
      });
      console.log(`After search query filtering: ${filtered.length} projects remain`);
    }
    
    // Apply university filter - check only project.university
    if (filters.university !== "_all") {
      console.log(`Filtering by university: ${filters.university}`);
      
      // Get the university name from the selected ID
      const selectedUniversityName = getUniversityName(filters.university);
      console.log(`Selected university name: ${selectedUniversityName}`);
      
      filtered = filtered.filter(project => {
        // Try matching by ID or name, but only on project fields
        const matchesProjectUniversity = project.university === filters.university;
        const matchesProjectUniversityName = project.university === selectedUniversityName;
        
        const matches = matchesProjectUniversity || matchesProjectUniversityName;
        
        console.log(`Project ${project.id} - project.university: "${project.university}", matches: ${matches}`);
        
        return matches;
      });
      console.log(`After university filtering: ${filtered.length} projects remain`);
    }
    
    // Apply faculty filter - check only project.faculty
    if (filters.faculty !== "_all") {
      console.log(`Filtering by faculty: ${filters.faculty}`);
      
      // Get the faculty name from the selected ID
      const selectedFacultyName = getFacultyName(filters.university, filters.faculty);
      console.log(`Selected faculty name: ${selectedFacultyName}`);
      
      filtered = filtered.filter(project => {
        // Try matching by ID or name, but only on project fields
        const matchesProjectFaculty = project.faculty === filters.faculty;
        const matchesProjectFacultyName = project.faculty === selectedFacultyName;
        
        const matches = matchesProjectFaculty || matchesProjectFacultyName;
        
        console.log(`Project ${project.id} - project.faculty: "${project.faculty}", matches: ${matches}`);
        
        return matches;
      });
      console.log(`After faculty filtering: ${filtered.length} projects remain`);
    }
    
    // Apply category filter (only for proiect and cerere tabs)
    if (showCategoryFilter && filters.category !== "_all") {
      console.log(`Filtering by category/subject: ${filters.category}`);
      filtered = filtered.filter(project => {
        // Check different field combinations that might match the category
        const matchesCategory = project.category === filters.category;
        const matchesSubject = project.subject === filters.category;
        
        console.log(`Project ${project.id} - category: ${project.category}, subject: ${project.subject}, matches: ${matchesCategory || matchesSubject}`);
        
        return matchesCategory || matchesSubject;
      });
      console.log(`After category filtering: ${filtered.length} projects remain`);
    }

    // Sort projects
    if (sortOrder === 'desc') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'asc') {
      filtered = filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    console.log(`Final filtered projects count: ${filtered.length}`);
    setFilteredProjects(filtered);
  }, [activeTab, diverseSubcategory, projects, searchQuery, sortOrder, filters, showCategoryFilter]);

  // Handlers
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setDiverseSubcategory("all") // Reset subcategory when changing tabs
    
    // Reset category filter if switching to diverse tab
    if (value === "diverse" && filters.category !== "_all") {
      setFilters(prev => ({ ...prev, category: "_all" }));
    }
    
    router.push(`/browse?tab=${value}`)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  // Disable filter button functionality for now
  const openDialog = () => {
    setIsFilterDialogOpen(true);
  }

  // Replace the simplified handler with a real implementation
  const handleApplyFilters = (newFilters: {
    university: string;
    faculty: string;
    category: string;
  }) => {
    console.log('Applying filters:', newFilters);
    
    // Log sample project data
    if (projects.length > 0) {
      const sampleProject = projects[0];
      console.log('Sample project data for comparison:');
      console.log({
        'Project ID': sampleProject.id,
        'Project title': sampleProject.title,
        'Project university': sampleProject.university,
        'Project faculty': sampleProject.faculty,
        'Project category': sampleProject.category,
        'Project subject': sampleProject.subject,
        'Filter university': newFilters.university,
        'Filter faculty': newFilters.faculty,
        'Filter category': newFilters.category
      });
      
      // Check if any projects would match these filters
      const matchingProjects = projects.filter(project => {
        const matchesUniversity = newFilters.university === "_all" || project.university === newFilters.university;
        const matchesFaculty = newFilters.faculty === "_all" || project.faculty === newFilters.faculty;
        const matchesCategory = newFilters.category === "_all" || 
                               project.category === newFilters.category || 
                               project.subject === newFilters.category;
        
        return matchesUniversity && matchesFaculty && matchesCategory;
      });
      
      console.log(`Found ${matchingProjects.length} projects matching these filters out of ${projects.length} total`);
      
      if (matchingProjects.length > 0) {
        console.log('First matching project:', matchingProjects[0].title);
      }
    }
    
    setFilters(newFilters);
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <TabsSection tabs={tabsData} activeTab={activeTab} setActiveTab={handleTabChange} />
        <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
          <Link href="/projects/new">Add a new project</Link>
        </Button>
      </div>

      <HeroSection
        title={tabsData.find((tab) => tab.id === activeTab)?.label || ""}
        description={tabsData.find((tab) => tab.id === activeTab)?.description || ""}
      />

      {/* Show subcategories only for diverse tab */}
      {activeTab === "diverse" && (
        <div className="flex flex-wrap gap-2 my-4">
          {diverseSubcategories.map((subcategory) => (
            <Button
              key={subcategory.id}
              variant={diverseSubcategory === subcategory.id ? "default" : "outline"}
              className={diverseSubcategory === subcategory.id ? "bg-purple-600 hover:bg-purple-700" : ""}
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
        <FilterButton onFilter={openDialog} activeFiltersCount={activeFiltersCount} />
      </div>

      <div className="mt-6">
        {filteredProjects.length > 0 ? (
          <ProductGrid projects={filteredProjects} />
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No projects found matching your criteria.</p>
          </div>
        )}
      </div>

      {isFilterDialogOpen && (
        <FilterDialog
          isOpen={true} 
          onClose={() => setIsFilterDialogOpen(false)}
          onApplyFilters={handleApplyFilters}
          showCategoryFilter={showCategoryFilter}
          currentFilters={filters}
        />
      )}
    </>
  )
}
