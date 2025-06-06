"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageToggle";
import { ProjectQuota } from "@/components/ProjectQuota";

interface ProjectWithRating {
  id: string;
  title: string;
  type: string;
  images: string[];
  reviews: Array<{
    id: string;
    score: number;
  }>;
  averageRating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: Date;
}

export default function UserProjects() {
  const [projects, setProjects] = useState<ProjectWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();
  const { language, forceRefresh } = useLanguage();

  // Translations
  const translations = useMemo(
    () => ({
      myProjects: language === "ro" ? "Proiectele mele" : "My Projects",
      noProjects:
        language === "ro"
          ? "Nu ai creat niciun proiect încă"
          : "You haven't created any projects yet",
      createProject:
        language === "ro" ? "Creează un proiect" : "Create a project",
      showMore: language === "ro" ? "Arată mai multe" : "Show more",
      showLess: language === "ro" ? "Arată mai puține" : "Show less",
      deleteConfirm:
        language === "ro"
          ? "Ești sigur că vrei să ștergi acest proiect?"
          : "Are you sure you want to delete this project?",
    }),
    [language, forceRefresh]
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects/user");
        if (response.ok) {
          const data = await response.json();

          // Calculate average rating for each project
          const projectsWithRating = data.projects.map(
            (project: ProjectWithRating) => {
              const reviewCount = project.reviews?.length || 0;
              const totalScore =
                project.reviews?.reduce(
                  (sum: number, review: { score: number }) =>
                    sum + review.score,
                  0
                ) || 0;
              const averageRating =
                reviewCount > 0 ? totalScore / reviewCount : 0;

              return {
                ...project,
                averageRating,
                reviewCount,
              };
            }
          );

          setProjects(projectsWithRating);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Get displayed projects based on showAll state
  const displayedProjects = showAll ? projects : projects.slice(0, 4);
  const hasMoreProjects = projects.length > 4;

  const handleDelete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      // Remove the project from the local state
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      // You might want to show an error toast here
    }
  };

  const handleReactivate = async (projectId: string) => {
    try {
      // Set a new expiration date 30 days from now
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          isActive: true,
          expiresAt: newExpiresAt.toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to reactivate project:", error);
        // You might want to show an error message to the user here
        return;
      }

      console.log("Project reactivated successfully");
      // Force a refresh of the projects list
      router.refresh();
      // Optional: You could also refresh the current page
      window.location.reload();
    } catch (error) {
      console.error("Error reactivating project:", error);
      // You might want to show an error message to the user here
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{translations.myProjects}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2">
          <CardTitle>{translations.myProjects}</CardTitle>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/projects/new")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {translations.createProject}
            </Button>
            <ProjectQuota />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{translations.noProjects}</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => router.push("/projects/new")}
            >
              {translations.createProject}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedProjects.map((project) => (
              <Card key={project.id} className="mb-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-bold">{project.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {!project.isActive && (
                      <Badge variant="secondary" className="mr-2">
                        Inactive
                        </Badge>
                    )}
                    <div className="flex items-center">
                      {project.averageRating !== undefined && (
                        <>
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="mr-2">{project.averageRating.toFixed(1)}</span>
                        </>
                      )}
                      {project.reviewCount !== undefined && (
                        <span className="text-sm text-gray-500">
                          ({project.reviewCount} {language === "ro" ? "recenzii" : "reviews"})
                        </span>
                      )}
                      </div>
                    {!project.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-7"
                        onClick={() => handleReactivate(project.id)}
                      >
                        {language === "ro" ? "Reactivează" : "Reactivate"}
                      </Button>
                    )}
                  <Button
                      variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/projects/edit/${project.id}`)}
                  >
                      <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                      variant="ghost"
                    size="icon"
                      onClick={() => {
                      if (confirm(translations.deleteConfirm)) {
                          handleDelete(project.id);
                      }
                    }}
                  >
                      <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                </CardHeader>
              </Card>
            ))}

            {hasMoreProjects && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center"
                >
                  {showAll ? (
                    <>
                      {translations.showLess}{" "}
                      <ChevronUp className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      {translations.showMore}{" "}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
