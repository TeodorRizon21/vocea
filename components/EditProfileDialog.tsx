"use client"

import { useState, useEffect, useMemo } from "react"
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
import { useLanguage } from "@/components/LanguageToggle"

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
  const { language, forceRefresh } = useLanguage()
  const [universitySearch, setUniversitySearch] = useState("")
  const [facultySearch, setFacultySearch] = useState("")

  // Traduceri pentru componenta
  const translations = useMemo(() => {
    return {
      editProfile: language === "ro" ? "Editare Profil" : "Edit Profile",
      university: language === "ro" ? "Universitate" : "University",
      faculty: language === "ro" ? "Facultate" : "Faculty",
      city: language === "ro" ? "Oraș" : "City",
      studyYear: language === "ro" ? "An de studiu" : "Study Year",
      selectUniversity: language === "ro" ? "Selectează universitatea" : "Select your university",
      selectFaculty: language === "ro" ? "Selectează facultatea" : "Select your faculty",
      searchUniversity: language === "ro" ? "Caută universitate..." : "Search university...",
      searchFaculty: language === "ro" ? "Caută facultate..." : "Search faculty...",
      noUniversityFound: language === "ro" ? "Nu s-a găsit nicio universitate." : "No university found.",
      noFacultyFound: language === "ro" ? "Nu s-a găsit nicio facultate." : "No faculty found.",
      enterCity: language === "ro" ? "Introdu orașul" : "Enter your city",
      cityAutoSet: language === "ro" ? "Orașul este setat automat în funcție de universitatea selectată." : "City is automatically set based on your university.",
      selectYear: language === "ro" ? "Selectează anul de studiu" : "Select your year of study",
      year1: language === "ro" ? "Anul 1" : "1st Year",
      year2: language === "ro" ? "Anul 2" : "2nd Year",
      year3: language === "ro" ? "Anul 3" : "3rd Year",
      year4: language === "ro" ? "Anul 4" : "4th Year",
      year5: language === "ro" ? "Anul 5" : "5th Year",
      year6: language === "ro" ? "Anul 6" : "6th Year",
      masters: language === "ro" ? "Masterat" : "Masters",
      phd: language === "ro" ? "Doctorat" : "PhD",
      cancel: language === "ro" ? "Anulează" : "Cancel",
      saveChanges: language === "ro" ? "Salvează modificările" : "Save Changes",
      saving: language === "ro" ? "Se salvează..." : "Saving...",
      fillAllFields: language === "ro" ? "Te rog completează toate câmpurile obligatorii" : "Please fill in all required fields",
      saveError: language === "ro" ? "Nu s-a putut salva informația. Te rog încearcă din nou." : "Failed to save your information. Please try again."
    };
  }, [language, forceRefresh]);

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
          <DialogTitle>{translations.editProfile}</DialogTitle>
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
              {translations.university}
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
                <SelectValue placeholder={translations.selectUniversity} />
              </SelectTrigger>
              <SelectContent className="p-0 w-[700px]">
                <div className="flex items-center px-3 pb-2 pt-3 border-b">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder={translations.searchUniversity}
                    className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={universitySearch}
                    onChange={(e) => setUniversitySearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-72">
                  {filteredUniversities.length === 0 ? (
                    <div className="py-6 text-center text-sm">{translations.noUniversityFound}</div>
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
              {translations.faculty}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.facultyId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, facultyId: value }))}
              required
              disabled={!formData.universityId}
            >
              <SelectTrigger className="min-h-[2.5rem] h-auto whitespace-normal text-left">
                <SelectValue placeholder={translations.selectFaculty} />
              </SelectTrigger>
              <SelectContent className="p-0 w-[700px]">
                <div className="flex items-center px-3 pb-2 pt-3 border-b">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder={translations.searchFaculty}
                    className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-72">
                  {filteredFaculties.length === 0 ? (
                    <div className="py-6 text-center text-sm">{translations.noFacultyFound}</div>
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
              {translations.city}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              placeholder={translations.enterCity}
              required
              readOnly={!!formData.universityId}
              className={formData.universityId ? "bg-transparent" : ""}
            />
            {formData.universityId && (
              <p className="text-xs text-muted-foreground">{translations.cityAutoSet}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="year">
              {translations.studyYear}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.year}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, year: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.selectYear} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{translations.year1}</SelectItem>
                <SelectItem value="2">{translations.year2}</SelectItem>
                <SelectItem value="3">{translations.year3}</SelectItem>
                <SelectItem value="4">{translations.year4}</SelectItem>
                <SelectItem value="5">{translations.year5}</SelectItem>
                <SelectItem value="6">{translations.year6}</SelectItem>
                <SelectItem value="masters">{translations.masters}</SelectItem>
                <SelectItem value="phd">{translations.phd}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {translations.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.universityId || !formData.facultyId || !formData.city || !formData.year}
          >
            {isSubmitting ? translations.saving : translations.saveChanges}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

