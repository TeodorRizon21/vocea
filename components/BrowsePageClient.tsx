"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import TabsSection from "@/components/TabsSection"
import SearchBar from "@/components/SearchBar"
import SortButton from "@/components/SortButton"
import FilterButton from "@/components/FilterButton"
import { Button } from "@/components/ui/button"
import HeroSection from "@/components/HeroSection"
import type { Project } from "@prisma/client"
import ProductGrid from "@/components/ProductGrid"
import FilterDialog from "@/components/FilterDialog"
import { useUniversities } from "@/hooks/useUniversities"

// Define the ExtendedProject type to match what ProductGrid expects
interface ExtendedProject extends Project {
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
  projects: Project[]
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
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filters, setFilters] = useState({ university: "", faculty: "" })
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [extendedProjects, setExtendedProjects] = useState<ExtendedProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ExtendedProject[]>([])

  // Transform projects to ExtendedProject type
  useEffect(() => {
    const transformedProjects = projects.map(project => ({
      ...project,
      user: {
        firstName: null,
        lastName: null,
        university: null,
        faculty: null,
        avatar: null
      },
      reviews: []
    })) as ExtendedProject[]
    
    setExtendedProjects(transformedProjects)
  }, [projects])

  // Apply filters to extended projects
  useEffect(() => {
    // First filter by tab
    let result = extendedProjects.filter((project) => project.type === activeTab)

    // Then apply subcategory filter for diverse items
    if (activeTab === "diverse" && diverseSubcategory !== "all") {
      result = result.filter((project) => project.category === diverseSubcategory)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query) ||
          project.subject.toLowerCase().includes(query)
      )
    }

    // Apply university and faculty filters
    if (filters.university) {
      result = result.filter((project) => project.university === filters.university)
    }
    if (filters.faculty) {
      result = result.filter((project) => project.faculty === filters.faculty)
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    })

    // Update state with filtered projects
    setFilteredProjects(result)
  }, [activeTab, diverseSubcategory, extendedProjects, searchQuery, filters, sortOrder])

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  // Handlers
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setDiverseSubcategory("all") // Reset subcategory when changing tabs
    router.push(`/browse?tab=${value}`)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  const handleFilter = () => {
    setIsFilterDialogOpen(true)
  }

  const handleApplyFilters = (newFilters: { university: string; faculty: string }) => {
    setFilters(newFilters)
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <TabsSection tabs={tabsData} activeTab={activeTab} setActiveTab={handleTabChange} />
        <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
          <a href="/projects/new">Add a new project</a>
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
        <FilterButton onFilter={handleFilter} activeFiltersCount={activeFiltersCount} />
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

      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </>
  )
}

