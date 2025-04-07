"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

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

type ProjectType = "proiect" | "cerere" | "diverse"

export default function NewProjectPage() {
  const [images, setImages] = useState<File[]>([])
  const [projectType, setProjectType] = useState<ProjectType>("proiect")
  const [formError, setFormError] = useState("")

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate images for Proiect and Diverse types
    if (projectType !== "cerere" && images.length === 0) {
      setFormError("Images are required for Projects and Diverse submissions")
      return
    }

    setFormError("")
    // Handle form submission here
    console.log("Form submitted")
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-purple-600 mb-6">Add a new project</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Label>Project Type</Label>
          <RadioGroup
            defaultValue="proiect"
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

        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="Enter project title" required />
        </div>

        {projectType !== "cerere" && (
          <div className="space-y-2">
            <Label htmlFor="images">
              Add Images
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input id="images" type="file" multiple onChange={handleImageUpload} accept="image/*" required />
            {images.length > 0 && <p className="text-sm text-gray-500">{images.length} image(s) selected</p>}
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
          <Textarea id="description" placeholder="Enter project description" required />
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" placeholder="Enter project subject" required />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select required>
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
          <Input id="university" placeholder="Enter your university" required />
        </div>

        <div>
          <Label htmlFor="faculty">Faculty</Label>
          <Input id="faculty" placeholder="Enter your faculty" required />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" placeholder="Enter your phone number" pattern="[0-9]{10}" required />
          <p className="text-sm text-gray-500 mt-1">Format: 10 digits number</p>
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 transition-colors">
          Create {projectType === "cerere" ? "Project Request" : "Project"}
        </Button>
      </form>
    </div>
  )
}

