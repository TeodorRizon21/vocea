"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUniversities } from "@/hooks/useUniversities"

interface ForumFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: { university: string; faculty: string; category: string }) => void
  currentFilters: { university: string; faculty: string; category: string }
}

export default function ForumFilterDialog({ isOpen, onClose, onApplyFilters, currentFilters }: ForumFilterDialogProps) {
  const { universities, getFacultiesForUniversity, getUniversityName, getFacultyName } = useUniversities()

  // Initialize state with current filters or defaults
  const [selectedUniversity, setSelectedUniversity] = useState<string>(currentFilters.university || "")
  const [selectedFaculty, setSelectedFaculty] = useState<string>(currentFilters.faculty || "")
  const [selectedCategory, setSelectedCategory] = useState<string>(currentFilters.category || "")

  // Reset internal state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university || "")
      setSelectedFaculty(currentFilters.faculty || "")
      setSelectedCategory(currentFilters.category || "")
    }
  }, [isOpen, currentFilters])

  // Memoize available faculties
  const availableFaculties = useMemo(() => {
    if (selectedUniversity && selectedUniversity !== "all") {
      return getFacultiesForUniversity(selectedUniversity)
    }
    return []
  }, [selectedUniversity, getFacultiesForUniversity])

  // Forum categories
  const categories = [
    { id: "general", name: "General" },
    { id: "academic", name: "Academic" },
    { id: "events", name: "Events" },
    { id: "housing", name: "Housing" },
    { id: "jobs", name: "Jobs & Internships" },
    { id: "social", name: "Social" },
  ]

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value)
    setSelectedFaculty("") // Reset faculty when university changes
  }

  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
  }

  const handleApply = () => {
    onApplyFilters({
      university: selectedUniversity,
      faculty: selectedFaculty,
      category: selectedCategory,
    })
    onClose()
  }

  const handleReset = () => {
    setSelectedUniversity("")
    setSelectedFaculty("")
    setSelectedCategory("")
    onApplyFilters({
      university: "",
      faculty: "",
      category: "",
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
              disabled={!selectedUniversity || selectedUniversity === ""}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={selectedUniversity ? "Select a faculty" : "Select university first"} />
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
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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

