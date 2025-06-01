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
  university?: string
  faculty?: string
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

      console.log("Selected university:", selectedUniversity);
      console.log("Selected faculty:", selectedFaculty);
      
      if (!selectedUniversity || !selectedFaculty) {
        throw new Error("Could not find selected university or faculty");
      }

      // Ensure university and faculty names are properly defined
      if (!selectedUniversity.name || !selectedFaculty.name) {
        console.error("Missing name in selected university or faculty:", {
          university: selectedUniversity,
          faculty: selectedFaculty
        });
        throw new Error("University or faculty name is missing");
      }

      // Create the submission data with explicit name properties
      const submissionData = {
        ...formData,
        universityId: selectedUniversity.id,
        facultyId: selectedFaculty.id,
        university: selectedUniversity.name,  // Explicitly include the name
        faculty: selectedFaculty.name,        // Explicitly include the name
      };
      
      console.log("Submitting onboarding data from dialog:", submissionData);
      console.log("University name being sent:", submissionData.university);
      console.log("Faculty name being sent:", submissionData.faculty);
      
      // Submit the data
      await onSubmit(submissionData);
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isSubmitting) {
          onClose()
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          if (
            !formData.firstName ||
            !formData.lastName ||
            !formData.universityId ||
            !formData.facultyId ||
            !formData.city ||
            !formData.year
          ) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>Please provide your information to continue using the platform.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">
                First Name
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">
                Last Name
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="university">
              University
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.universityId}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  universityId: value,
                  facultyId: "",
                }))
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
              disabled={!formData.universityId}
              required
            >
              <SelectTrigger className="min-h-[2.5rem] h-auto whitespace-normal text-left">
                <SelectValue
                  placeholder={formData.universityId ? "Select your faculty" : "Select a university first"}
                />
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
              className={formData.universityId ? "bg-transparent" : ""}
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
                <SelectItem value="5">5th Year</SelectItem>
                <SelectItem value="6">6th Year</SelectItem>
                <SelectItem value="masters">Masters</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !formData.firstName ||
              !formData.lastName ||
              !formData.universityId ||
              !formData.facultyId ||
              !formData.city ||
              !formData.year
            }
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
