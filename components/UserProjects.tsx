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
              <div
                key={project.id}
                className="flex flex-col xs:flex-row xs:items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center space-x-4 mb-2 xs:mb-0">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden">
                    <Image
                      src={project.images[0] || "/placeholder.svg"}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {project.type.charAt(0).toUpperCase() +
                        project.type.slice(1)}
                    </p>
                    {project.reviewCount && project.reviewCount > 0 ? (
                      <div className="flex items-center mt-1">
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{project.averageRating?.toFixed(1) || 0}</span>
                          <span className="text-xs">
                            ({project.reviewCount})
                          </span>
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          {language === "ro" ? "Nicio recenzie încă" : "No reviews yet"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1 justify-end xs:justify-start">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push(`/projects/edit/${project.id}`)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={async () => {
                      if (confirm(translations.deleteConfirm)) {
                        try {
                          const response = await fetch(
                            `/api/projects/${project.id}`,
                            {
                              method: "DELETE",
                            }
                          );
                          if (response.ok) {
                            setProjects(
                              projects.filter((p) => p.id !== project.id)
                            );
                          }
                        } catch (error) {
                          console.error("Error deleting project:", error);
                        }
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
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
