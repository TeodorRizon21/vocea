"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUniversities } from "@/hooks/useUniversities"
import { FORUM_CATEGORIES } from "@/lib/constants"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(200, "Content must be at least 200 characters long"),
  university: z.string().min(1, "University is required"),
  faculty: z.string().min(1, "Faculty is required"),
  category: z.string().min(1, "Category is required"),
})

export default function NewForumTopic() {
  const router = useRouter()
  const { userId } = useAuth()
  const { universities, getFacultiesForUniversity, getUniversityName, getFacultyName } = useUniversities()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      university: "",
      faculty: "",
      category: "",
    },
  })

  const selectedUniversity = form.watch("university")
  const availableFaculties = selectedUniversity ? getFacultiesForUniversity(selectedUniversity) : []

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    setSuccess(null)

    if (!userId) {
      setError("You must be logged in to create a topic")
      return
    }

    setIsSubmitting(true)
    try {
      // Get the university and faculty names
      const universityName = getUniversityName(values.university)
      const facultyName = getFacultyName(values.university, values.faculty)

      const response = await fetch("/api/forum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          content: values.content,
          university: universityName,
          faculty: facultyName,
          category: values.category,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create topic")
      }

      setSuccess("Topic created successfully")
      router.push("/forum")
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create topic")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter topic title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter topic content (minimum 200 characters)"
                    className="min-h-[200px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-sm text-muted-foreground">
                  {field.value.length} / 200 characters minimum
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FORUM_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="university"
            render={({ field }) => (
              <FormItem>
                <FormLabel>University</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a university" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university.id} value={university.id}>
                        {university.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="faculty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Faculty</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!selectedUniversity}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedUniversity
                            ? "Select a faculty"
                            : "Select university first"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableFaculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Topic"}
          </Button>
        </form>
      </Form>
    </div>
  )
}

