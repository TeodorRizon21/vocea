"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useUniversities } from "@/hooks/useUniversities"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NewTopicPage() {
  const router = useRouter()
  const { universities, getFacultiesForUniversity } = useUniversities()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    universityId: "",
    facultyId: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const faculties = getFacultiesForUniversity(formData.universityId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.title || !formData.content || !formData.universityId || !formData.facultyId) {
      setError("All fields are required")
      return
    }

    if (formData.content.length < 200) {
      setError("Topic content must be at least 200 characters long")
      return
    }

    setIsSubmitting(true)

    try {
      const selectedUniversity = universities.find((u) => u.id === formData.universityId)
      const selectedFaculty = faculties.find((f) => f.id === formData.facultyId)

      const submitData = {
        ...formData,
        university: selectedUniversity?.name || "",
        faculty: selectedFaculty?.name || "",
      }

      const response = await fetch("/api/forum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      router.push("/forum")
    } catch (error) {
      console.error("Error creating topic:", error)
      setError(error instanceof Error ? error.message : "Failed to create topic")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-purple-600">Create New Topic</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Enter topic title"
            required
          />
        </div>

        <div>
          <Label htmlFor="content">
            Content <span className="text-sm text-muted-foreground">(minimum 200 characters)</span>
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="Enter topic content"
            required
            className="min-h-[200px]"
          />
          <p className="text-sm text-muted-foreground mt-1">{formData.content.length} / 200 characters minimum</p>
        </div>

        <div>
          <Label htmlFor="university">University</Label>
          <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, universityId: value }))}>
            <SelectTrigger className="w-full">
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
          <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, facultyId: value }))}>
            <SelectTrigger className="w-full">
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-4">
          <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Topic"
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

