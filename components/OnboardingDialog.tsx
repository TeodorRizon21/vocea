"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUniversities } from "@/hooks/useUniversities"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OnboardingFormData {
  firstName: string
  lastName: string
  universityId: string
  facultyId: string
  university: string
  faculty: string
  city: string
  year: string
}

interface OnboardingDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: OnboardingFormData) => Promise<void>
}

export default function OnboardingDialog({ isOpen, onClose, onSubmit }: OnboardingDialogProps) {
  const { universities, loading, getFacultiesForUniversity, getUniversityName, getFacultyName } = useUniversities()
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: "",
    lastName: "",
    universityId: "",
    facultyId: "",
    university: "",
    faculty: "",
    city: "",
    year: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [universitySearch, setUniversitySearch] = useState("")
  const [facultySearch, setFacultySearch] = useState("")

  const faculties = getFacultiesForUniversity(formData.universityId)

  // Filter universities based on search term
  const filteredUniversities = universities.filter(
    (university) =>
      university.name.toLowerCase().includes(universitySearch.toLowerCase()) ||
      university.city.toLowerCase().includes(universitySearch.toLowerCase()),
  )

  // Filter faculties based on search term
  const filteredFaculties = faculties.filter((faculty) =>
    faculty.name.toLowerCase().includes(facultySearch.toLowerCase()),
  )

  const handleSubmit = async () => {
    setError("")

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.universityId ||
      !formData.facultyId ||
      !formData.city ||
      !formData.year
    ) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const selectedUniversity = universities.find((u) => u.id === formData.universityId)
      const selectedFaculty = faculties.find((f) => f.id === formData.facultyId)

      await onSubmit({
        ...formData,
        university: selectedUniversity?.name || "",
        faculty: selectedFaculty?.name || "",
      })
    } catch (error) {
      console.error("Error submitting onboarding data:", error)
      setError(error instanceof Error ? error.message : "Failed to save your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update city when university changes
  useEffect(() => {
    if (formData.universityId) {
      const university = universities.find((u) => u.id === formData.universityId)
      if (university) {
        setFormData((prev) => ({ ...prev, city: university.city }))
      }
    }
  }, [formData.universityId, universities])

  // Reset faculty when university changes
  useEffect(() => {
    if (formData.universityId) {
      setFormData((prev) => ({ ...prev, facultyId: "", faculty: "" }))
    }
  }, [formData.universityId])

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        universityId: "",
        facultyId: "",
        university: "",
        faculty: "",
        city: "",
        year: "",
      })
      setError("")
    }
  }, [isOpen])

  if (loading) {
    return (
      <Dialog open={isOpen}>
        <DialogContent>
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please provide your information to get started with Vocea Campusului.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">University *</Label>
            <div className="relative">
              <Input
                id="university"
                value={universitySearch}
                onChange={(e) => setUniversitySearch(e.target.value)}
                placeholder="Search for your university"
                className="pr-10"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <ScrollArea className="h-[200px] rounded-md border p-2">
              {loading ? (
                <div className="flex justify-center p-4">Loading universities...</div>
              ) : filteredUniversities.length > 0 ? (
                <div className="space-y-1">
                  {filteredUniversities.map((university) => (
                    <Button
                      key={university.id}
                      variant={formData.universityId === university.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          universityId: university.id,
                          university: university.name,
                        })
                        setUniversitySearch(university.name)
                      }}
                    >
                      {university.name} ({university.city})
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">No universities found</div>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty *</Label>
            <div className="relative">
              <Input
                id="faculty"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                placeholder="Search for your faculty"
                className="pr-10"
                disabled={!formData.universityId}
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <ScrollArea className="h-[200px] rounded-md border p-2">
              {!formData.universityId ? (
                <div className="p-4 text-center text-gray-500">Select a university first</div>
              ) : filteredFaculties.length > 0 ? (
                <div className="space-y-1">
                  {filteredFaculties.map((faculty) => (
                    <Button
                      key={faculty.id}
                      variant={formData.facultyId === faculty.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          facultyId: faculty.id,
                          faculty: faculty.name,
                        })
                        setFacultySearch(faculty.name)
                      }}
                    >
                      {faculty.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">No faculties found</div>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Select
              value={formData.year}
              onValueChange={(value) => setFormData({ ...formData, year: value })}
            >
              <SelectTrigger id="year">
                <SelectValue placeholder="Select your year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Year 1</SelectItem>
                <SelectItem value="2">Year 2</SelectItem>
                <SelectItem value="3">Year 3</SelectItem>
                <SelectItem value="4">Year 4</SelectItem>
                <SelectItem value="5">Year 5</SelectItem>
                <SelectItem value="6">Year 6</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

