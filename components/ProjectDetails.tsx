"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import {
  Eye,
  Calendar,
  Book,
  School,
  Phone,
  MessageSquare,
  Trash2,
  Heart,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { toast } from "@/hooks/use-toast";
import ContactRevealDialog from "@/components/ContactRevealDialog";
import ReportButton from "@/components/ReportButton";
import ReviewForm from "@/components/ReviewForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageToggle";
import { useTheme } from "next-themes";
import useEmblaCarousel from 'embla-carousel-react';

interface ProjectDetailsProps {
  project: {
    id: string;
    type: string;
    title: string;
    description: string;
    subject: string;
    category: string;
    university: string;
    faculty: string;
    phoneNumber: string;
    images: string[];
    createdAt: Date;
    userId: string;
    user: {
      firstName: string | null;
      lastName: string | null;
      university: string | null;
      faculty: string | null;
      avatar: string | null;
    };
    reviews: Array<{
      id?: string;
      score: number;
      comment: string | null;
      userId?: string;
      projectId?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }>;
  };
}

export default function ProjectDetails({ project }: ProjectDetailsProps) {
  const [isContactVisible, setIsContactVisible] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [hasReviewed, setHasReviewed] = useState(false);
  const { language, forceRefresh } = useLanguage();
  const { theme } = useTheme();
  const [emblaRef, emblaApi] = useEmblaCarousel();

  // Traduceri pentru pagina
  const translations = useMemo(() => {
    return {
      backToBrowse:
        language === "ro" ? "Înapoi la Răsfoiește" : "Back to Browse",
      delete: language === "ro" ? "Șterge" : "Delete",
      projectRequest: language === "ro" ? "Cerere Proiect" : "Project Request",
      diverse: language === "ro" ? "Diverse" : "Diverse",
      project: language === "ro" ? "Proiect" : "Project",
      author: language === "ro" ? "Autor" : "Author",
      description: language === "ro" ? "Descriere" : "Description",
      projectDetails: language === "ro" ? "Detalii Proiect" : "Project Details",
      published: language === "ro" ? "Publicat" : "Published",
      subject: language === "ro" ? "Subiect" : "Subject",
      university: language === "ro" ? "Universitate" : "University",
      faculty: language === "ro" ? "Facultate" : "Faculty",
      postedBy: language === "ro" ? "Postat de" : "Posted By",
      category: language === "ro" ? "Categorie" : "Category",
      averageRating: language === "ro" ? "Notă medie" : "Average Rating",
      noRatingsYet: language === "ro" ? "Nicio notă încă" : "No ratings yet",
      contact: language === "ro" ? "Contact" : "Contact",
      revealContact: language === "ro" ? "Arată contactul" : "Reveal Contact",
      showAppreciation:
        language === "ro" ? "Arată apreciere" : "Show Appreciation",
      cancel: language === "ro" ? "Anulează" : "Cancel",
      alreadyReviewed:
        language === "ro"
          ? "Ai recenzat deja acest proiect"
          : "You've already reviewed this project",
      yourProject:
        language === "ro"
          ? "Acesta este proiectul tău"
          : "This is your project",
      deleteConfirm:
        language === "ro"
          ? "Ești sigur că vrei să ștergi acest proiect? Această acțiune nu poate fi anulată."
          : "Are you sure you want to delete this project? This action cannot be undone.",
      projectDeleted:
        language === "ro" ? "Proiectul a fost șters" : "Project deleted",
      projectDeletedDesc:
        language === "ro"
          ? "Proiectul a fost șters cu succes"
          : "The project has been successfully deleted",
      errorDeleting:
        language === "ro"
          ? "Eroare la ștergerea proiectului"
          : "Failed to delete project",
      unexpectedError:
        language === "ro"
          ? "A apărut o eroare neașteptată"
          : "An unexpected error occurred",
    };
  }, [language, forceRefresh]);

  useEffect(() => {
    if (isSignedIn && user) {
      // Check for admin role in public metadata
      const publicMetadata = user.publicMetadata;
      setIsAdmin(publicMetadata.isAdmin === true);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    const checkUserReview = async () => {
      if (!isSignedIn || !user) return;

      try {
        const response = await fetch(
          `/api/reviews?projectId=${project.id}&userId=${user.id}`
        );
        if (response.ok) {
          const reviews = await response.json();
          setHasReviewed(reviews.length > 0);
        }
      } catch (error) {
        console.error("Error checking user review:", error);
      }
    };

    checkUserReview();
  }, [project.id, isSignedIn, user]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        setCurrentSlide(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  const handleRevealContact = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmReveal = () => {
    setIsContactVisible(true);
    setIsDialogOpen(false);
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(translations.deleteConfirm)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: translations.projectDeleted,
          description: translations.projectDeletedDesc,
        });
        router.push("/browse");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: translations.errorDeleting,
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: translations.unexpectedError,
      });
    }
  };

  const formatDate = (date: Date) => {
    if (language === "ro") {
      return new Date(date).toLocaleDateString("ro-RO");
    }
    return new Date(date).toLocaleDateString();
  };

  const authorName =
    project.user.firstName && project.user.lastName
      ? `${project.user.firstName} ${project.user.lastName}`
      : "Anonymous";

  const initials =
    project.user.firstName && project.user.lastName
      ? `${project.user.firstName[0]}${project.user.lastName[0]}`
      : "?";

  const isOwner = isSignedIn && user?.id === project.userId;

  // Calculate average rating
  const averageRating =
    project.reviews && project.reviews.length > 0
      ? project.reviews.reduce((sum, review) => sum + review.score, 0) /
        project.reviews.length
      : 0;

  // Format average rating to one decimal place
  const formattedRating =
    averageRating > 0 ? averageRating.toFixed(1) : translations.noRatingsYet;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => router.push("/browse")}
          className="mb-6"
        >
          {translations.backToBrowse}
        </Button>
        <div className="flex space-x-2">
          <ReportButton contentType="project" contentId={project.id} />
          {(isOwner || isAdmin) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProject}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {translations.delete}
            </Button>
          )}
        </div>
      </div>

      {/* Project Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-purple-600">
            {project.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-purple-600">
              {project.type === "cerere"
                ? translations.projectRequest
                : project.type === "diverse"
                ? translations.diverse
                : translations.project}
            </Badge>
            <Badge variant="outline">{project.category}</Badge>
            {project.reviews && project.reviews.length > 0 && (
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200"
              >
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
          </div>
        </div>
      </div>

      {/* Project Showcase */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Project Images */}
          <div className="w-full relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {project.images.map((image, index) => (
                  <div key={index} className="flex-[0_0_100%] min-w-0">
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
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full w-10 h-10 flex items-center justify-center ${
                theme === 'dark' 
                  ? 'bg-indigo-900/80 hover:bg-indigo-900 text-white' 
                  : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full w-10 h-10 flex items-center justify-center ${
                theme === 'dark' 
                  ? 'bg-indigo-900/80 hover:bg-indigo-900 text-white' 
                  : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {project.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                    currentSlide === index
                      ? theme === 'dark'
                        ? 'bg-indigo-900 scale-125'
                        : 'bg-indigo-600 scale-125'
                      : theme === 'dark'
                        ? 'bg-indigo-900/50 hover:bg-indigo-900/80'
                        : 'bg-indigo-600/50 hover:bg-indigo-600/80'
                  }`}
                  onClick={() => emblaApi?.scrollTo(index)}
                />
              ))}
            </div>
          </div>

          {/* Project Description */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {translations.description}
            </h2>
            <p className="text-white">{project.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {translations.projectDetails}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                {translations.published}: {formatDate(project.createdAt)}
              </p>
              <p className="flex items-center gap-2">
                <Book className="h-4 w-4 text-gray-500" />
                {translations.subject}: {project.subject}
              </p>
              <p className="flex items-center gap-2">
                <School className="h-4 w-4 text-gray-500" />
                {translations.university}: {project.university}
              </p>
              <p className="flex items-center gap-2">
                <School className="h-4 w-4 text-gray-500" />
                {translations.faculty}: {project.faculty}
              </p>
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                {translations.postedBy}:{" "}
                <Link href={`/profile/${project.userId}`} className="underline">
                  {project.user.firstName} {project.user.lastName}
                </Link>
              </p>
              <p className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                {translations.category}: {project.category}
              </p>
              <p className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-gray-500" />
                {translations.averageRating}: {formattedRating}
              </p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                {translations.contact}:{" "}
                {isContactVisible ? (
                  <a href={`tel:${project.phoneNumber}`} className="underline">
                    {project.phoneNumber}
                  </a>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRevealContact}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {translations.revealContact}
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
            <h2 className="text-xl font-semibold">
              {translations.showAppreciation}
            </h2>
            {!isOwner && !hasReviewed && (
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                <Heart className="h-4 w-4 mr-2" />
                {showReviewForm
                  ? translations.cancel
                  : translations.showAppreciation}
              </Button>
            )}
          </div>

          {!isOwner && !hasReviewed && showReviewForm && (
            <div className="mt-4">
              <ReviewForm
                projectId={project.id}
                onSubmit={() => {
                  setShowReviewForm(false);
                  setHasReviewed(true);
                  toast({
                    title: "Thank you for your review!",
                    description: "Your appreciation has been recorded.",
                  });
                }}
              />
            </div>
          )}

          {!isOwner && hasReviewed && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
              <Heart className="h-5 w-5 fill-purple-500 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {translations.alreadyReviewed}
              </p>
            </div>
          )}

          {isOwner && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {translations.yourProject}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
