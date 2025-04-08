"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2, Plus, Loader2, ImagePlus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUniversities } from "@/hooks/useUniversities"

interface NewsItem {
  id: string
  title: string
  description: string
  image?: string | null
  city: string
  university?: string | null
  createdAt: string
  updatedAt: string
}

export default function NewsManagementPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    city: "",
    university: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { universities, loading: universitiesLoading, getUniversityCity } = useUniversities()
  const [availableCities, setAvailableCities] = useState<string[]>([])

  useEffect(() => {
    if (!universitiesLoading) {
      const cities = Array.from(new Set(universities.map((uni) => uni.city)))
      setAvailableCities(cities)
    }
  }, [universities, universitiesLoading])

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setFormData((prev) => ({ ...prev, image: res[0].url }))
      }
      setIsUploading(false)
    },
    onUploadError: (error) => {
      console.error("Upload error:", error)
      setError("Failed to upload image")
      setIsUploading(false)
    },
  })

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const response = await fetch("/api/news")
      if (response.ok) {
        const data = await response.json()
        setNews(data)
      }
    } catch (error) {
      console.error("Error fetching news:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.city) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.description.length < 300) {
      setError("News description must be at least 300 characters")
      return
    }

    // If "oricare" is selected, set to empty string for the database
    const dataToSubmit = {
      ...formData,
      university: formData.university === "oricare" ? "" : formData.university,
      city: formData.city === "oricare" ? "" : formData.city,
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(editingNews ? `/api/news/${editingNews.id}` : "/api/news", {
        method: editingNews ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      await fetchNews()
      setIsDialogOpen(false)
      setFormData({ title: "", description: "", image: "", city: "", university: "" })
      setEditingNews(null)
    } catch (error) {
      console.error("Error saving news:", error)
      setError(error instanceof Error ? error.message : "Failed to save news")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (news.length <= 1) {
      alert("Cannot delete the last news item")
      return
    }

    if (confirm("Are you sure you want to delete this news item?")) {
      try {
        const response = await fetch(`/api/news/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          await fetchNews()
        }
      } catch (error) {
        console.error("Error deleting news:", error)
      }
    }
  }

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item)
    setFormData({
      title: item.title,
      description: item.description,
      image: item.image || "",
      city: item.city || "",
      university: item.university || "",
    })
    setIsDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true)
      await startUpload([e.target.files[0]])
    }
  }

  const handleUniversityChange = (universityId: string) => {
    if (universityId === "oricare") {
      setFormData((prev) => ({
        ...prev,
        university: "oricare",
        // Don't auto-populate city when "oricare" is selected
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        university: universityId,
        city: universityId ? getUniversityCity(universityId) : "",
      }))
    }
  }

  const handleCityChange = (city: string) => {
    setFormData((prev) => ({
      ...prev,
      city: city,
      university: "",
    }))
  }

  if (loading || universitiesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">News Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add News
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All News</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {news.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-4">
                    {item.image && (
                      <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                        <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <span className="font-medium">{item.city}</span>
                        {item.university && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{item.university}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last updated: {new Date(item.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNews ? "Edit News" : "Add News"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Input
                placeholder="News Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <Select onValueChange={handleUniversityChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select University (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oricare">Oricare</SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.university || formData.university === "oricare" ? (
              <Select onValueChange={handleCityChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select City (required)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oricare">Oricare</SelectItem>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input placeholder="City (auto-populated)" value={formData.city} readOnly />
            )}
            <div>
              <Textarea
                placeholder="News Description (min 300 characters)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[200px]"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/300 characters (minimum)
              </div>
            </div>
            <div>
              {formData.image && (
                <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                  <Image src={formData.image || "/placeholder.svg"} alt="News image" fill className="object-contain" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData({ ...formData, image: "" })}
                  >
                    Remove Image
                  </Button>
                </div>
              )}
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById("image-upload")?.click()}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {formData.image ? "Change Image" : "Upload Image"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

