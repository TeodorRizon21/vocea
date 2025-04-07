"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUniversities } from "@/hooks/useUniversities"

interface FilterDialogProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: { university: string; faculty: string }) => void
  currentFilters: { university: string; faculty: string }
}

export default function FilterDialog({ isOpen, onClose, onApplyFilters, currentFilters }: FilterDialogProps) {
  const { universities, getFacultiesForUniversity } = useUniversities()

  // Initialize state with current filters or defaults
  const [selectedUniversity, setSelectedUniversity] = useState<string>(currentFilters.university || "")
  const [selectedFaculty, setSelectedFaculty] = useState<string>(currentFilters.faculty || "")

  // Reset internal state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university || "")
      setSelectedFaculty(currentFilters.faculty || "")
    }
  }, [isOpen, currentFilters])

  // Memoize available faculties
  const availableFaculties = useMemo(() => {
    if (selectedUniversity) {
      return getFacultiesForUniversity(selectedUniversity)
    }
    return []
  }, [selectedUniversity])

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value)
    setSelectedFaculty("") // Reset faculty when university changes
  }

  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value)
  }

  const handleApply = () => {
    onApplyFilters({
      university: selectedUniversity,
      faculty: selectedFaculty,
    })
    onClose()
  }

  const handleReset = () => {
    setSelectedUniversity("")
    setSelectedFaculty("")
    onApplyFilters({
      university: "",
      faculty: "",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Projects</DialogTitle>
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
            <Select value={selectedFaculty} onValueChange={handleFacultyChange} disabled={!selectedUniversity}>
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

