"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { Eye, Calendar, Book, School, Phone, MessageSquare, Trash2, Heart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { toast } from "@/hooks/use-toast"
import ContactRevealDialog from "@/components/ContactRevealDialog"
import ReportButton from "@/components/ReportButton"
import ReviewForm from "@/components/ReviewForm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface ProjectDetailsProps {
  project: {
    id: string
    type: string
    title: string
    description: string
    subject: string
    category: string
    university: string
    faculty: string
    phoneNumber: string
    images: string[]
    createdAt: Date
    userId: string
    user: {
      firstName: string | null
      lastName: string | null
      university: string | null
      faculty: string | null
      avatar: string | null
    }
    reviews: Array<{
      id?: string
      score: number
      comment: string | null
      userId?: string
      projectId?: string
      createdAt?: Date
      updatedAt?: Date
    }>
  }
}

export default function ProjectDetails({ project }: ProjectDetailsProps) {
  const [isContactVisible, setIsContactVisible] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  const [hasReviewed, setHasReviewed] = useState(false)

  useEffect(() => {
    if (isSignedIn && user) {
      // Check for admin role in public metadata
      const publicMetadata = user.publicMetadata
      setIsAdmin(publicMetadata.isAdmin === true)
    }
  }, [isSignedIn, user])

  useEffect(() => {
    const checkUserReview = async () => {
      if (!isSignedIn || !user) return

      try {
        const response = await fetch(`/api/reviews?projectId=${project.id}&userId=${user.id}`)
        if (response.ok) {
          const reviews = await response.json()
          setHasReviewed(reviews.length > 0)
        }
      } catch (error) {
        console.error("Error checking user review:", error)
      }
    }

    checkUserReview()
  }, [project.id, isSignedIn, user])

  const handleRevealContact = () => {
    setIsDialogOpen(true)
  }

  const handleConfirmReveal = () => {
    setIsContactVisible(true)
    setIsDialogOpen(false)
  }

  const handleDeleteProject = async () => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Project deleted",
          description: "The project has been successfully deleted"
        })
        router.push("/browse")
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete project"
        })
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      })
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
  }

  const authorName =
    project.user.firstName && project.user.lastName ? `${project.user.firstName} ${project.user.lastName}` : "Anonymous"

  const initials =
    project.user.firstName && project.user.lastName ? `${project.user.firstName[0]}${project.user.lastName[0]}` : "?"

  const isOwner = isSignedIn && user?.id === project.userId

  // Calculate average rating
  const averageRating =
    project.reviews && project.reviews.length > 0
      ? project.reviews.reduce((sum, review) => sum + review.score, 0) / project.reviews.length
      : 0

  // Format average rating to one decimal place
  const formattedRating = averageRating > 0 ? averageRating.toFixed(1) : "No ratings yet"

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/browse")} className="mb-6">
          Back to Browse
        </Button>
        <div className="flex space-x-2">
          <ReportButton contentType="project" contentId={project.id} />
          {(isOwner || isAdmin) && (
            <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Project Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-purple-600">{project.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-purple-600">
              {project.type === "cerere" ? "Project Request" : project.type === "diverse" ? "Diverse" : "Project"}
            </Badge>
            <Badge variant="outline">{project.category}</Badge>
            {project.reviews && project.reviews.length > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                ★ {formattedRating} ({project.reviews.length})
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={project.user.avatar || ""} alt={authorName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{authorName}</p>
            {/* <p className="text-sm text-gray-500">
              {project.user.university}, {project.user.faculty}
            </p> */}
          </div>
        </div>
      </div>

      {/* Project Showcase */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Project Images */}
          <div className="w-full">
            <Carousel className="w-full">
              <CarouselContent>
                {project.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <div className="relative w-full aspect-video">
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`Image ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                          className="object-contain rounded-md"
                          priority={index === 0}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>

          {/* Project Description */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-white">{project.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                Published: {formatDate(project.createdAt)}
              </p>
              <p className="flex items-center gap-2">
                <Book className="h-4 w-4 text-gray-500" />
                Subject: {project.subject}
              </p>
              <p className="flex items-center gap-2">
                <School className="h-4 w-4 text-gray-500" />
                University: {project.university}
              </p>
              <p className="flex items-center gap-2">
                <School className="h-4 w-4 text-gray-500" />
                Faculty: {project.faculty}
              </p>
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                Posted By:{" "}
                <Link href={`/profile/${project.userId}`} className="underline">
                  {project.user.firstName} {project.user.lastName}
                </Link>
              </p>
              <p className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                Category: {project.category}
              </p>
              <p className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-gray-500" />
                Average Rating: {formattedRating}
              </p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                Contact:{" "}
                {isContactVisible ? (
                  <a href={`tel:${project.phoneNumber}`} className="underline">
                    {project.phoneNumber}
                  </a>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={handleRevealContact}>
                      <Eye className="h-4 w-4 mr-2" />
                      Reveal Contact
                    </Button>
                    <ContactRevealDialog
                      isOpen={isDialogOpen}
                      onConfirm={handleConfirmReveal}
                      onClose={() => setIsDialogOpen(false)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Show Appreciation</h2>
            {!isOwner && !hasReviewed && (
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                <Heart className="h-4 w-4 mr-2" />
                {showReviewForm ? "Cancel" : "Show Appreciation"}
              </Button>
            )}
          </div>
          
          {!isOwner && !hasReviewed && showReviewForm && (
            <div className="mt-4">
              <ReviewForm
                projectId={project.id}
                onSubmit={() => {
                  setShowReviewForm(false)
                  setHasReviewed(true)
                  toast({
                    title: "Thank you for your review!",
                    description: "Your appreciation has been recorded."
                  })
                }}
              />
            </div>
          )}
          
          {!isOwner && hasReviewed && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
              <Heart className="h-5 w-5 fill-purple-500 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300">You've already reviewed this project</p>
            </div>
          )}
          
          {isOwner && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">This is your project</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
