"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import UserActivity from "@/components/UserActivity";
import UserProjectsList from "@/components/UserProjectsList";
import type { Project } from "@prisma/client";
import { Star } from "lucide-react";
import { useUniversities } from "@/hooks/useUniversities";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";

interface UserActivityType {
  projectsCreated: number;
  projectsJoined: number;
  commentsPosted: number;
  forumTopicsCreated: number;
  recentComments: Array<{
    id: number;
    content: string;
    projectTitle: string;
    topicId: string;
  }>;
}

interface User {
  firstName: string | null;
  lastName: string | null;
  university: string | null;
  faculty: string | null;
  city: string | null;
  year: string | null;
  avatar: string | null;
  topics: Array<{
    id: string;
    title: string;
    createdAt: Date;
    _count: {
      comments: number;
    };
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    topic: {
      id?: string;
      title: string;
    };
  }>;
  activity: UserActivityType;
  projects: Project[];
  averageRating: number | null;
  reviewCount: number;
}

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { getUniversityName, getFacultyName } = useUniversities();
  const [userPlan, setUserPlan] = useState("Basic");
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedCommentId, setSelectedCommentId] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error("Failed to fetch user");
        }
        const data = await response.json();

        // Ensure the activity has the correct structure
        if (data.activity && data.activity.recentComments) {
          data.activity.recentComments = data.activity.recentComments.map(
            (comment: any) => ({
              ...comment,
              topicId: comment.topicId || "unknown",
            })
          );
        }

        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPlan = async () => {
      try {
        // Obține planul utilizatorului curent (cel logat)
        const response = await fetch(`/api/user`);
        if (response.ok) {
          const userData = await response.json();
          setUserPlan(userData.planType || "Basic");
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
      }
    };

    fetchUser();
    fetchUserPlan();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const initials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : "?";
  const universityName = user.university
    ? getUniversityName(user.university)
    : "University not set";
  const facultyName =
    user.faculty && user.university
      ? getFacultyName(user.university, user.faculty)
      : null;

  const handleTopicClick = (
    topicId: string | undefined,
    commentId?: string
  ) => {
    if (!topicId) {
      return; // Dacă nu există topicId, nu facem nimic
    }

    // Construim URL-ul cu hash pentru identificarea comentariului
    const targetUrl = commentId
      ? `/forum/${topicId}#comment-${commentId}`
      : `/forum/${topicId}`;

    if (userPlan === "Basic") {
      // Pentru utilizatorii cu plan Basic, afișăm dialogul de acces respins
      setSelectedTopicId(topicId);
      setSelectedCommentId(commentId || "");
      setShowAccessDenied(true);
    } else {
      // Pentru utilizatorii cu planuri premium, permitem navigarea
      router.push(targetUrl);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-8">
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {user.firstName} {user.lastName}
              </CardTitle>
              <p className="text-muted-foreground">
                {universityName}
                {facultyName && `, ${facultyName}`}
              </p>
              {user.city && user.year && (
                <p className="text-sm text-muted-foreground mt-1">
                  {user.city} • Year {user.year}
                </p>
              )}
            </div>

            {/* Display user rating */}
            {user.averageRating !== null && (
              <div className="ml-auto flex items-center">
                <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-full">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">
                    {user.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm whitespace-nowrap">
                    ({user.reviewCount}{" "}
                    {user.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Activity Stats */}
      <UserActivity activity={user.activity} userPlan={userPlan} />

      {/* User's Projects */}
      <UserProjectsList projects={user.projects} />

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Topics</h3>
          {user.topics && user.topics.length > 0 ? (
            <div className="space-y-4">
              {user.topics.map((topic) => (
                <Card
                  key={topic.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleTopicClick(topic.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{topic.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(topic.createdAt), "PPP 'at' HH:mm")}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {topic._count.comments} comments
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground">No topics yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Comments</h3>
          {user.comments && user.comments.length > 0 ? (
            <div className="space-y-4">
              {user.comments.map((comment) => {
                // Verificăm dacă comentariul și topicul există
                const hasValidTopic =
                  comment && comment.topic && comment.topic.title;

                // Extragem topicId din baza de date (dacă există) sau încercăm să-l obținem din API
                // În acest caz vom încerca să folosim topic.id dacă există
                const topicId = comment.topic?.id;

                return (
                  <Card
                    key={comment.id}
                    className={
                      hasValidTopic && topicId
                        ? "cursor-pointer hover:shadow-md transition-all"
                        : ""
                    }
                    onClick={() => {
                      if (hasValidTopic && topicId) {
                        handleTopicClick(topicId, comment.id);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">
                        {hasValidTopic
                          ? comment.topic.title
                          : "Topic indisponibil"}
                      </h4>
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(comment.createdAt), "PPP 'at' HH:mm")}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground">No comments yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog de acces respins pentru utilizatorii cu plan Basic */}
      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath={
          selectedCommentId
            ? `/forum/${selectedTopicId}#comment-${selectedCommentId}`
            : `/forum/${selectedTopicId}`
        }
      />
    </div>
  );
}
