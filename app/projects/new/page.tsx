"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Loader2, Search } from "lucide-react"
import type { ProjectType } from "@/types/project"
import { useUploadThing } from "@/lib/uploadthing"
import ProjectImageUpload from "@/components/ProjectImageUpload"
import { useUniversities } from "@/hooks/useUniversities"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ACADEMIC_CATEGORIES, DIVERSE_CATEGORIES } from "@/lib/constants"

export default function NewProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [projectType, setProjectType] = useState<ProjectType>("proiect")
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [universitySearch, setUniversitySearch] = useState("")
  const [facultySearch, setFacultySearch] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    category: "",
    universityId: "",
    facultyId: "",
    phoneNumber: "",
    city: "", // We'll keep this for display purposes only
  })

  const { universities, loading, getFacultiesForUniversity } = useUniversities()
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

  const { startUpload } = useUploadThing("projectImage")

  // Reset category when project type changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, category: "" }))
  }, [projectType])

  // Update city when university changes
  useEffect(() => {
    if (formData.universityId) {
      const university = universities.find((u) => u.id === formData.universityId)
      if (university) {
        setFormData((prev) => ({ ...prev, city: university.city }))
      }
    }
  }, [formData.universityId, universities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate phone number
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError("Phone number must be exactly 10 digits")
      return
    }

    // Validate images for Proiect and Diverse types
    if (projectType !== "cerere" && uploadedImages.length === 0) {
      setError("Images are required for Projects and Diverse submissions")
      return
    }

    // Validate university and faculty
    if (!formData.universityId || !formData.facultyId) {
      setError("Please select a university and faculty")
      return
    }

    // Validate category
    if (!formData.category) {
      setError("Please select a category")
      return
    }

    // Validate that diverse projects have a diverse category
    if (projectType === "diverse" && !DIVERSE_CATEGORIES.some((cat) => cat.id === formData.category)) {
      setError("Please select a valid category for diverse items")
      return
    }

    // Validate that proiect and cerere have academic categories
    if ((projectType === "proiect" || projectType === "cerere") && 
        !ACADEMIC_CATEGORIES.includes(formData.category)) {
      setError("Please select a valid academic category")
      return
    }

    setIsSubmitting(true)

    try {
      const selectedUniversity = universities.find((u) => u.id === formData.universityId)
      const selectedFaculty = faculties.find((f) => f.id === formData.facultyId)

      if (!selectedUniversity || !selectedFaculty) {
        throw new Error("Selected university or faculty not found")
      }

      // Only include fields that exist in the Prisma schema
      const projectData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        category: formData.category,
        university: selectedUniversity.name,
        faculty: selectedFaculty.name,
        phoneNumber: formData.phoneNumber,
        type: projectType,
        images: uploadedImages,
      }

      console.log("Submitting project data:", projectData) // Debug log

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create project")
      }

      const result = await response.json()
      console.log("Project created successfully:", result) // Debug log

      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating project:", error)
      setError(error instanceof Error ? error.message : "Failed to create project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-purple-600">Create New Project</h1>
        <p className="text-gray-600 mt-2">Share your project with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Label>Project Type</Label>
          <RadioGroup
            defaultValue="proiect"
            value={projectType}
            onValueChange={(value) => setProjectType(value as ProjectType)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="proiect" id="proiect" />
              <Label htmlFor="proiect" className="cursor-pointer">
                Proiect
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cerere" id="cerere" />
              <Label htmlFor="cerere" className="cursor-pointer">
                Cerere Proiect
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="diverse" id="diverse" />
              <Label htmlFor="diverse" className="cursor-pointer">
                Diverse
              </Label>
            </div>
          </RadioGroup>
        </div>

        {projectType === "diverse" && (
          <div className="space-y-4">
            <Label>Diverse Category</Label>
            <div className="flex flex-wrap gap-2">
              {DIVERSE_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant={formData.category === category.id ? "default" : "outline"}
                  className={formData.category === category.id ? "bg-purple-600 hover:bg-purple-700" : ""}
                  onClick={() => setFormData((prev) => ({ ...prev, category: category.id }))}
                >
                  {category.label}
                </Button>
              ))}
            </div>
            {!formData.category && (
              <p className="text-sm text-amber-600">Please select a category for your diverse item</p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Enter project title"
            required
          />
        </div>

        {projectType !== "cerere" && (
          <div className="space-y-2">
            <Label>
              Images
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <ProjectImageUpload
              onImagesUploaded={(urls) => setUploadedImages(urls)}
              existingImages={uploadedImages}
              maxImages={4}
            />
          </div>
        )}

        {projectType === "cerere" && (
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-600 dark:text-blue-400">
              Images are optional for Project Requests
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Enter project description"
            required
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
            placeholder="Enter project subject"
            required
          />
        </div>

        {projectType !== "diverse" && (
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="university">University</Label>
          <Select
            value={formData.universityId}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, universityId: value, facultyId: "" }))
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a university" />
            </SelectTrigger>
            <SelectContent className="p-0">
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
                    <SelectItem key={university.id} value={university.id} className="cursor-pointer">
                      <div className="flex flex-col">
                        <span>{university.name}</span>
                        <span className="text-xs text-muted-foreground">{university.city}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="faculty">Faculty</Label>
          <Select
            value={formData.facultyId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, facultyId: value }))}
            disabled={!formData.universityId}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.universityId ? "Select a faculty" : "Select a university first"} />
            </SelectTrigger>
            <SelectContent className="p-0">
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
                    <SelectItem key={faculty.id} value={faculty.id} className="cursor-pointer">
                      {faculty.name}
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={formData.city} readOnly className="bg-gray-100" />
          <p className="text-sm text-gray-500 mt-1">City is automatically set based on the selected university</p>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="Enter your phone number"
            pattern="[0-9]{10}"
            required
          />
          <p className="text-sm text-gray-500 mt-1">Format: 10 digits number</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            `Create ${projectType === "cerere" ? "Project Request" : projectType === "diverse" ? "Diverse Item" : "Project"}`
          )}
        </Button>
      </form>
    </div>
  )
}

