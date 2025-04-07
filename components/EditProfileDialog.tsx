"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUniversities } from "@/hooks/useUniversities"
import type { User } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface EditProfileFormData {
  universityId: string
  facultyId: string
  city: string
  year: string
}

interface EditProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  initialData: User | null
  onSave: (data: EditProfileFormData) => Promise<void>
}

export default function EditProfileDialog({ isOpen, onClose, initialData, onSave }: EditProfileDialogProps) {
  const { universities, loading, getFacultiesForUniversity } = useUniversities()
  const [universitySearch, setUniversitySearch] = useState("")
  const [facultySearch, setFacultySearch] = useState("")

  // Find the university and faculty IDs from the names (for backward compatibility)
  const findUniversityId = (name?: string) => {
    if (!name || !universities.length) return ""
    const university = universities.find((u) => u.name === name)
    return university?.id || ""
  }

  const findFacultyId = (universityId: string, name?: string) => {
    if (!name || !universityId) return ""
    const faculties = getFacultiesForUniversity(universityId)
    const faculty = faculties.find((f) => f.name === name)
    return faculty?.id || ""
  }

  const [initialUniversityId, setInitialUniversityId] = useState("")
  const [initialFacultyId, setInitialFacultyId] = useState("")
  const [formData, setFormData] = useState<EditProfileFormData>({
    universityId: "",
    facultyId: "",
    city: initialData?.city || "",
    year: initialData?.year || "",
  })

  useEffect(() => {
    if (universities.length > 0 && initialData) {
      const uniId = findUniversityId(initialData.university)
      setInitialUniversityId(uniId)

      const facId = findFacultyId(uniId, initialData.faculty)
      setInitialFacultyId(facId)

      // Find the university object to get its city
      const university = universities.find((u) => u.id === uniId)

      setFormData({
        universityId: uniId,
        facultyId: facId,
        city: university?.city || initialData.city || "",
        year: initialData.year || "",
      })
    }
  }, [universities, initialData])

  // Get faculties based on selected university
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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Update city when university changes
  useEffect(() => {
    if (formData.universityId) {
      const university = universities.find((u) => u.id === formData.universityId)
      if (university) {
        setFormData((prev) => ({ ...prev, city: university.city }))
      }
    }
  }, [formData.universityId, universities])

  const handleSubmit = async () => {
    setError("")

    if (!formData.universityId || !formData.facultyId || !formData.city || !formData.year) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      // Submit with IDs
      await onSave(formData)
    } catch (error) {
      console.error("Error saving profile:", error)
      setError("Failed to save your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="university">
              University
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.universityId}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, universityId: value, facultyId: "" }))
              }}
              required
            >
              <SelectTrigger className="min-h-[2.5rem] h-auto whitespace-normal text-left">
                <SelectValue placeholder="Select your university" />
              </SelectTrigger>
              <SelectContent className="p-0 w-[700px]">
                <div className="flex items-center px-3 pb-2 pt-3 border-b">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Search university..."
                    className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={universitySearch}
                    onChange={(e) => setUniversitySearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-72">
                  {filteredUniversities.length === 0 ? (
                    <div className="py-6 text-center text-sm">No university found.</div>
                  ) : (
                    filteredUniversities.map((university) => (
                      <SelectItem key={university.id} value={university.id} className="cursor-pointer py-3">
                        <div className="flex flex-col gap-1">
                          <span className="whitespace-normal break-words leading-snug">{university.name}</span>
                          <span className="text-xs text-muted-foreground">{university.city}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="faculty">
              Faculty
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.facultyId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, facultyId: value }))}
              required
              disabled={!formData.universityId}
            >
              <SelectTrigger className="min-h-[2.5rem] h-auto whitespace-normal text-left">
                <SelectValue placeholder="Select your faculty" />
              </SelectTrigger>
              <SelectContent className="p-0 w-[700px]">
                <div className="flex items-center px-3 pb-2 pt-3 border-b">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Search faculty..."
                    className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-72">
                  {filteredFaculties.length === 0 ? (
                    <div className="py-6 text-center text-sm">No faculty found.</div>
                  ) : (
                    filteredFaculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id} className="cursor-pointer py-3">
                        <span className="whitespace-normal break-words leading-snug">{faculty.name}</span>
                      </SelectItem>
                    ))
                  )}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">
              City
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Enter your city"
              required
              readOnly={!!formData.universityId}
              className={formData.universityId ? "bg-gray-100" : ""}
            />
            {formData.universityId && (
              <p className="text-xs text-muted-foreground">City is automatically set based on your university.</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="year">
              Study Year
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.year}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, year: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your year of study" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
                <SelectItem value="masters">Masters</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.universityId || !formData.facultyId || !formData.city || !formData.year}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

