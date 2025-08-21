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
  description: string;
  subject: string;
  category: string;
  type: string;
  university: string;
  faculty: string;
  images: string[];
  reviews: Array<{
    id: string;
    score: number;
  }>;
  averageRating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
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
      deactivateConfirm:
        language === "ro"
          ? "Ești sigur că vrei să dezactivezi acest proiect?"
          : "Are you sure you want to deactivate this project?",
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
        alert(error.message || (language === "ro" ? "Nu s-a putut reactiva proiectul" : "Failed to reactivate project"));
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

  const handleDeactivate = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          isActive: false
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to deactivate project:", error);
        alert(error.message || (language === "ro" ? "Nu s-a putut dezactiva proiectul" : "Failed to deactivate project"));
        return;
      }

      console.log("Project deactivated successfully");
      // Force a refresh of the projects list
      router.refresh();
      // Optional: You could also refresh the current page
      window.location.reload();
    } catch (error) {
      console.error("Error deactivating project:", error);
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
              <Card key={project.id} className={`mb-4 ${!project.isActive ? 'opacity-90 border-gray-300' : 'border-gray-200'}`}>
                <CardHeader>
                  <div className="flex flex-row items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {project.images && project.images.length > 0 && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={project.images[0]}
                            alt={project.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl font-bold truncate">{project.title}</CardTitle>
                          {!project.isActive && (
                            <Badge variant="outline" className="text-xs flex-shrink-0 border-orange-300 text-orange-600 bg-orange-50">
                              {language === "ro" ? "Inactiv" : "Inactive"}
                            </Badge>
                          )}
                        </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>{project.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="capitalize">{project.type}</span>
                          <span>•</span>
                          <span>{project.subject}</span>
                          <span>•</span>
                          <span>{new Date(project.createdAt).toLocaleDateString('ro-RO')}</span>
                          {project.averageRating !== undefined && project.averageRating > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                <span>{project.averageRating.toFixed(1)}</span>
                                {project.reviewCount !== undefined && (
                                  <span className="text-gray-400 ml-1">
                                    ({project.reviewCount})
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>{project.university}</span>
                          {project.faculty && (
                            <>
                              <span>•</span>
                              <span>{project.faculty}</span>
                            </>
                          )}
                          {!project.isActive && project.expiresAt && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600 font-medium">
                                {language === "ro" ? "Expirat pe" : "Expired on"} {new Date(project.expiresAt).toLocaleDateString('ro-RO')}
                              </span>
                            </>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 md:ml-4 flex-shrink-0">
                      {!project.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 md:px-3 py-1 h-8 text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleReactivate(project.id)}
                          title={language === "ro" ? "Reactivează proiectul pentru 30 de zile" : "Reactivate project for 30 days"}
                        >
                          {language === "ro" ? "Reactivează" : "Reactivate"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 md:px-3 py-1 h-8 text-orange-600 border-orange-600 hover:bg-orange-50"
                          onClick={() => {
                            if (confirm(translations.deactivateConfirm)) {
                              handleDeactivate(project.id);
                            }
                          }}
                          title={language === "ro" ? "Dezactivează proiectul manual" : "Manually deactivate project"}
                        >
                          {language === "ro" ? "Dezactivează" : "Deactivate"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/projects/edit/${project.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(translations.deleteConfirm)) {
                            handleDelete(project.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
