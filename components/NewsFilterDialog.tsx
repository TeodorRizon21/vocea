"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUniversities } from "@/hooks/useUniversities"

interface NewsFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: { university: string; city: string }) => void
  currentFilters: { university: string; city: string }
}

export default function NewsFilterDialog({ isOpen, onClose, onApplyFilters, currentFilters }: NewsFilterDialogProps) {
  const { universities } = useUniversities()

  // Initialize state with current filters or defaults
  const [selectedUniversity, setSelectedUniversity] = useState<string>(currentFilters.university || "")
  const [selectedCity, setSelectedCity] = useState<string>(currentFilters.city || "")

  // Reset internal state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university || "")
      setSelectedCity(currentFilters.city || "")
    }
  }, [isOpen, currentFilters])

  // Cities list
  const cities = [
    { id: "bucharest", name: "Bucharest" },
    { id: "cluj", name: "Cluj-Napoca" },
    { id: "iasi", name: "Iași" },
    { id: "timisoara", name: "Timișoara" },
    { id: "constanta", name: "Constanța" },
    { id: "brasov", name: "Brașov" },
    { id: "craiova", name: "Craiova" },
    { id: "galati", name: "Galați" },
    { id: "oradea", name: "Oradea" },
  ]

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value)
  }

  const handleCityChange = (value: string) => {
    setSelectedCity(value)
  }

  const handleApply = () => {
    onApplyFilters({
      university: selectedUniversity,
      city: selectedCity,
    })
    onClose()
  }

  const handleReset = () => {
    setSelectedUniversity("")
    setSelectedCity("")
    onApplyFilters({
      university: "",
      city: "",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter News</DialogTitle>
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
            <Label htmlFor="city" className="text-right">
              City
            </Label>
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
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

