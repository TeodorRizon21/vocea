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
import { Info, Loader2 } from "lucide-react"
import ProjectImageUpload from "@/components/ProjectImageUpload"
import type { Project, ProjectType } from "@prisma/client"
import { useUniversities } from "@/hooks/useUniversities"

const categories = [
  "Data Science",
  "Business",
  "Computer Science",
  "Information Technology",
  "Language Learning",
  "Health",
  "Personal Development",
  "Physical Science and Engineering",
  "Social Sciences",
  "Arts and Humanities",
  "Math and Logic",
]

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [project, setProject] = useState<Project | null>(null)

  const { universities, getFacultiesForUniversity } = useUniversities()

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (response.ok) {
          const data = await response.json()

          // Find university and faculty IDs from names
          const universityId = universities.find((u) => u.name === data.university)?.id || ""
          const facultyId = universityId
            ? getFacultiesForUniversity(universityId).find((f) => f.name === data.faculty)?.id || ""
            : ""

          setProject({
            ...data,
            universityId,
            facultyId,
          })
        } else {
          setError("Failed to fetch project")
        }
      } catch (error) {
        console.error("Error fetching project:", error)
        setError("Failed to fetch project")
      } finally {
        setIsLoading(false)
      }
    }

    if (universities.length > 0) {
      fetchProject()
    }
  }, [params.id, universities])

  // Get faculties based on selected university
  const faculties = project ? getFacultiesForUniversity(project.universityId || "") : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    setError("")
    setIsSubmitting(true)

    try {
      if (project) {
        const selectedUniversity = universities.find((u) => u.id === project.universityId)
        const selectedFaculty = faculties.find((f) => f.id === project.facultyId)

        // Update the project data
        const { user, reviews, ...updateData } = project
        updateData.university = selectedUniversity?.name || ""
        updateData.faculty = selectedFaculty?.name || ""

        // Send the update
        const response = await fetch(`/api/projects/${params.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          throw new Error("Failed to update project")
        }

        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error updating project:", error)
      setError("Failed to update project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Project not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-purple-600">Edit Project</h1>
        <p className="text-gray-600 mt-2">Update your project details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Label>Project Type</Label>
          <RadioGroup
            value={project.type}
            onValueChange={(value: ProjectType) => setProject({ ...project, type: value })}
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

        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            placeholder="Enter project title"
            required
          />
        </div>

        {project.type !== "cerere" && (
          <div className="space-y-2">
            <Label>
              Images
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <ProjectImageUpload
              onImagesUploaded={(urls) => setProject({ ...project, images: urls })}
              existingImages={project.images}
              maxImages={4}
            />
          </div>
        )}

        {project.type === "cerere" && (
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
            value={project.description}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
            placeholder="Enter project description"
            required
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={project.subject}
            onChange={(e) => setProject({ ...project, subject: e.target.value })}
            placeholder="Enter project subject"
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={project.category}
            onValueChange={(value) => setProject({ ...project, category: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, "-")}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="university">University</Label>
          <Select
            onValueChange={(value) => {
              setProject({
                ...project,
                universityId: value,
                facultyId: "",
              })
            }}
            value={project.universityId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a university" />
            </SelectTrigger>
            <SelectContent>
              {universities.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="faculty">Faculty</Label>
          <Select
            onValueChange={(value) => setProject({ ...project, facultyId: value })}
            value={project.facultyId}
            disabled={!project.universityId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a faculty" />
            </SelectTrigger>
            <SelectContent>
              {faculties.map((faculty) => (
                <SelectItem key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={project.phoneNumber}
            onChange={(e) => setProject({ ...project, phoneNumber: e.target.value })}
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

        <div className="flex space-x-4">
          <Button
            type="submit"
            className="flex-1 bg-purple-600 hover:bg-purple-700 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Project"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

