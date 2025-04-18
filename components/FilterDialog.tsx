"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useUniversities } from "@/hooks/useUniversities"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ACADEMIC_CATEGORIES, STUDY_LEVELS } from "@/lib/constants"
import { RefreshCw } from "lucide-react"

interface FilterDialogProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: {
    university: string
    faculty: string
    category: string
    studyLevel: string
  }) => void
  showCategoryFilter?: boolean
  currentFilters?: {
    university: string
    faculty: string
    category: string
    studyLevel: string
  }
}

export default function FilterDialog({ 
  isOpen, 
  onClose, 
  onApplyFilters,
  showCategoryFilter = true,
  currentFilters
}: FilterDialogProps) {
  const { universities, faculties, getUniversityName, getFacultyName } = useUniversities()
  
  const defaultFilters = {
    university: "_all",
    faculty: "_all",
    category: "_all",
    studyLevel: "_all",
  }
  
  const [filters, setFilters] = useState(currentFilters || defaultFilters)

  // Initialize filters when dialog opens or when currentFilters changes
  useEffect(() => {
    if (isOpen && currentFilters) {
      setFilters(currentFilters)
    } else if (isOpen && !currentFilters) {
      setFilters(defaultFilters)
    }
  }, [isOpen, currentFilters])

  // When university changes, reset faculty selection only if not coming from currentFilters
  useEffect(() => {
    // Skip this reset on initial render or if resetting to currentFilters
    const isInitialRender = filters.university === (currentFilters?.university || defaultFilters.university);
    
    if (!isInitialRender && filters.university !== "_all") {
      setFilters(prev => ({ ...prev, faculty: "_all" }))
    }
  }, [filters.university, currentFilters])

  const handleApply = () => {
    console.log("Applying filters:", filters);
    
    // Check if we have any selected values to log data structure
    if (filters.university !== "_all") {
      const selectedUniversity = universities.find(uni => uni.id === filters.university);
      console.log("Selected university:", selectedUniversity);
    }
    
    if (filters.faculty !== "_all" && filters.university !== "_all") {
      const faculties = universities
        .find(uni => uni.id === filters.university)
        ?.faculties || [];
      const selectedFaculty = faculties.find(fac => fac.id === filters.faculty);
      console.log("Selected faculty:", selectedFaculty);
    }
    
    // Apply filters and close the dialog
    onApplyFilters(filters);
    onClose();
  }
  
  const handleReset = () => {
    setFilters(defaultFilters)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Projects</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Select
              value={filters.university}
              onValueChange={(value) => setFilters(prev => ({ ...prev, university: value }))}
            >
              <SelectTrigger id="university">
                <SelectValue placeholder="All Universities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Universities</SelectItem>
                {universities.map(uni => (
                  <SelectItem key={uni.id} value={uni.id}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty</Label>
            <Select
              value={filters.faculty}
              onValueChange={(value) => setFilters(prev => ({ ...prev, faculty: value }))}
              disabled={filters.university === "_all"}
            >
              <SelectTrigger id="faculty">
                <SelectValue placeholder="All Faculties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Faculties</SelectItem>
                {filters.university !== "_all" && 
                  faculties
                    .filter(faculty => faculty.universityId === filters.university)
                    .map(faculty => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
          </div>
          
          {showCategoryFilter && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {ACADEMIC_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {showCategoryFilter && (
            <div className="space-y-2">
              <Label htmlFor="studyLevel">Study Level</Label>
              <Select
                value={filters.studyLevel}
                onValueChange={(value) => setFilters(prev => ({ ...prev, studyLevel: value }))}
              >
                <SelectTrigger id="studyLevel">
                  <SelectValue placeholder="All Study Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Study Levels</SelectItem>
                  {STUDY_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

