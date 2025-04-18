"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUniversities } from "@/hooks/useUniversities"
import { FORUM_CATEGORIES } from "@/lib/constants"

interface ForumFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: { 
    university: string; 
    faculty: string; 
    category: string;
    city: string;
  }) => void
  currentFilters: { 
    university: string; 
    faculty: string; 
    category: string;
    city: string;
  }
}

export default function ForumFilterDialog({ isOpen, onClose, onApplyFilters, currentFilters }: ForumFilterDialogProps) {
  const { universities, getFacultiesForUniversity } = useUniversities()

  // Initialize state with current filters or defaults
  const [selectedUniversity, setSelectedUniversity] = useState<string>(currentFilters.university || "all")
  const [selectedFaculty, setSelectedFaculty] = useState<string>(currentFilters.faculty || "all")
  const [selectedCategory, setSelectedCategory] = useState<string>(currentFilters.category || "all")
  const [selectedCity, setSelectedCity] = useState<string>(currentFilters.city || "all")

  // Get unique cities from universities
  const cities = useMemo(() => {
    const uniqueCities = new Set(universities.map(u => u.city))
    return Array.from(uniqueCities).sort()
  }, [universities])

  // Reset internal state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university || "all")
      setSelectedFaculty(currentFilters.faculty || "all")
      setSelectedCategory(currentFilters.category || "all")
      setSelectedCity(currentFilters.city || "all")
    }
  }, [isOpen, currentFilters])

  // Memoize available faculties
  const availableFaculties = useMemo(() => {
    if (selectedUniversity && selectedUniversity !== "all") {
      return getFacultiesForUniversity(selectedUniversity)
    }
    return []
  }, [selectedUniversity, getFacultiesForUniversity])

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value)
    setSelectedFaculty("all") // Reset faculty when university changes
    
    // If a university is selected, update the city to match the university's city
    if (value !== "all") {
      const university = universities.find(u => u.id === value)
      if (university) {
        setSelectedCity(university.city)
      }
    } else {
      setSelectedCity("all") // Reset city when no university is selected
    }
  }

  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
  }

  const handleCityChange = (value: string) => {
    setSelectedCity(value)
    // If a city is selected, clear the university selection since we're filtering by city
    if (value !== "all") {
      setSelectedUniversity("all")
      setSelectedFaculty("all")
    }
  }

  const handleApply = () => {
    onApplyFilters({
      university: selectedUniversity === "all" ? "" : selectedUniversity,
      faculty: selectedFaculty === "all" ? "" : selectedFaculty,
      category: selectedCategory === "all" ? "" : selectedCategory,
      city: selectedCity === "all" ? "" : selectedCity,
    })
    onClose()
  }

  const handleReset = () => {
    setSelectedUniversity("all")
    setSelectedFaculty("all")
    setSelectedCategory("all")
    setSelectedCity("all")
    onApplyFilters({
      university: "",
      faculty: "",
      category: "",
      city: "",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Forum Topics</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="university" className="text-right">
              University
            </Label>
            <Select value={selectedUniversity} onValueChange={handleUniversityChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="faculty" className="text-right">
              Faculty
            </Label>
            <Select
              value={selectedFaculty}
              onValueChange={handleFacultyChange}
              disabled={!selectedUniversity || selectedUniversity === "all"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={selectedUniversity === "all" ? "Select university first" : "Select a faculty"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Faculties</SelectItem>
                {availableFaculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(!selectedUniversity || selectedUniversity === "all") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                City
              </Label>
              <Select 
                value={selectedCity} 
                onValueChange={handleCityChange}
                disabled={selectedUniversity !== "all"}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {FORUM_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

