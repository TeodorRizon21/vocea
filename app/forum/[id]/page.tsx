"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  Loader2,
  Reply,
  Star,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
  SortDesc,
} from "lucide-react";
import UserTooltip from "@/components/UserTooltip";
import ReportButton from "@/components/ReportButton";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";
import { useLanguage } from "@/components/LanguageToggle";
import { censorText } from '@/lib/censor';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    university: string | null;
    faculty: string | null;
    universityName?: string | null;
    facultyName?: string | null;
    avatar: string | null;
  };
  replies: Comment[];
  parentId?: string | null;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  university: string;
  faculty: string;
  universityName?: string;
  facultyName?: string;
  userId: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    university: string | null;
    faculty: string | null;
    universityName?: string | null;
    facultyName?: string | null;
    avatar: string | null;
  };
  comments: Comment[];
  isFavorited: boolean;
  isOwner: boolean;
}

interface CommentRepliesProps {
  replies: Comment[];
  topicOwnerId: string;
  onDeleteReply: (replyId: string) => Promise<void>;
  isAdmin: boolean;
}

function CommentReplies({
  replies,
  topicOwnerId,
  onDeleteReply,
  isAdmin,
}: CommentRepliesProps) {
  const { user } = useUser();
  const [visibleReplies, setVisibleReplies] = useState(2);
  const hasMoreReplies = replies.length > visibleReplies;
  const showingAllReplies = visibleReplies >= replies.length;
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru componenta
  const translations = useMemo(() => {
    return {
      author: language === "ro" ? "Autor" : "Author",
      at: language === "ro" ? "la" : "at",
      showLess: language === "ro" ? "Arată mai puține" : "Show Less",
      showMore: language === "ro" ? "Arată încă" : "Show",
      moreReplies: language === "ro" ? "răspunsuri în plus" : "More",
      reply: language === "ro" ? "răspuns" : "Reply",
      replies: language === "ro" ? "răspunsuri" : "Replies",
    };
  }, [language, forceRefresh]);

  const loadMoreReplies = () => {
    setVisibleReplies((prev) => Math.min(prev + 3, replies.length));
  };

  const showLessReplies = () => {
    setVisibleReplies(2);
  };

  // Formatea dată în funcție de limbă
  const formatDate = (date: string) => {
    if (language === "ro") {
      // Pentru română: "15 mai 2023 la 13:45"
      return `${format(new Date(date), "PPP")} ${translations.at} ${format(
        new Date(date),
        "HH:mm"
      )}`;
    }
    // Pentru engleză: "May 15, 2023 at 13:45"
    return format(new Date(date), `PPP '${translations.at}' HH:mm`);
  };

  return (
    <div className="space-y-4">
      {replies.slice(0, visibleReplies).map((reply) => (
        <Card
          key={reply.id}
          id={`comment-${reply.id}`}
          className="transition-colors duration-300"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <UserTooltip
                userId={reply.userId}
                firstName={reply.user.firstName}
                lastName={reply.user.lastName}
                university={reply.user.university}
                faculty={reply.user.faculty}
                universityName={reply.user.universityName}
                facultyName={reply.user.facultyName}
                avatar={reply.user.avatar}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarImage src={reply.user.avatar || undefined} />
                    <AvatarFallback>
                      {reply.user.firstName?.[0]}
                      {reply.user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium hover:underline">
                      {reply.user.firstName} {reply.user.lastName}
                      {reply.userId === topicOwnerId && (
                        <span className="text-yellow-500 text-sm ml-1">
                          ({translations.author})
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reply.user.universityName || reply.user.university}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reply.user.facultyName || reply.user.faculty}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(reply.createdAt)}
                    </p>
                  </div>
                </div>
              </UserTooltip>
              <div className="flex space-x-2">
                <ReportButton
                  contentType="forum_comment"
                  contentId={reply.id}
                />
                {(user?.id === reply.userId ||
                  user?.id === topicOwnerId ||
                  isAdmin) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteReply(reply.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <p>{reply.content}</p>
          </CardContent>
        </Card>
      ))}

      {replies.length > 2 && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={showingAllReplies ? showLessReplies : loadMoreReplies}
        >
          {showingAllReplies ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              {translations.showLess}
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              {translations.showMore}{" "}
              {Math.min(3, replies.length - visibleReplies)}{" "}
              {translations.moreReplies}{" "}
              {replies.length - visibleReplies === 1
                ? translations.reply
                : translations.replies}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default function TopicPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const urlParams = useParams();
  const { user } = useUser();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sortOption, setSortOption] = useState<
    "relevance" | "newest" | "oldest"
  >("newest");
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru componenta principală
  const translations = useMemo(() => {
    return {
      loading: language === "ro" ? "Se încarcă..." : "Loading...",
      error:
        language === "ro"
          ? "Eroare la încărcarea topicului:"
          : "Error loading topic:",
      notFound:
        language === "ro" ? "Topicul nu a fost găsit." : "Topic not found.",
      invalidId:
        language === "ro"
          ? "ID-ul topicului este invalid."
          : "Invalid topic ID.",
      comments: language === "ro" ? "Comentarii" : "Comments",
      replies: language === "ro" ? "Răspunsuri" : "Replies",
      reply: language === "ro" ? "Răspunde" : "Reply",
      cancel: language === "ro" ? "Anulează" : "Cancel",
      addComment:
        language === "ro" ? "Adaugă un comentariu..." : "Add a comment...",
      post: language === "ro" ? "Postează" : "Post",
      submitReply: language === "ro" ? "Trimite răspuns" : "Submit Reply",
      noComments:
        language === "ro"
          ? "Nu există comentarii pentru acest topic."
          : "No comments for this topic.",
      sortAsc:
        language === "ro" ? "Sortează: Cele mai vechi" : "Sort: Oldest First",
      sortDesc:
        language === "ro" ? "Sortează: Cele mai noi" : "Sort: Newest First",
      replyingTo:
        language === "ro" ? "Răspunde la comentariul lui" : "Replying to",
      commentEmpty:
        language === "ro"
          ? "Comentariul nu poate fi gol."
          : "Comment cannot be empty.",
      replyEmpty:
        language === "ro"
          ? "Răspunsul nu poate fi gol."
          : "Reply cannot be empty.",
      at: language === "ro" ? "la" : "at",
      noContent:
        language === "ro"
          ? "Nu există conținut pentru acest topic."
          : "No content for this topic.",
    };
  }, [language, forceRefresh]);

  // Effect pentru verificarea utilizatorului și încărcarea topicului
  useEffect(() => {
    // Validăm ID-ul topicului - verificăm doar dacă există și nu este gol
    if (!params.id || params.id.trim() === "") {
      console.error("Invalid topic ID");
      setError(translations.invalidId);
      setLoading(false);
      return;
    }

    // Verifică rolul de admin
    if (user) {
      const publicMetadata = user.publicMetadata;
      console.log("User data available:", {
        id: user.id,
        publicMetadata: publicMetadata,
      });

      const adminValue = publicMetadata.isAdmin === true;
      console.log("Setting isAdmin to:", adminValue);
      setIsAdmin(adminValue);

      if (adminValue) {
        console.log("User is an admin!");
      }
    }

    // Funcție pentru a gestiona încărcarea datelor
    const loadData = async () => {
      console.log("Starting loadData function");
      // Verifică mai întâi dacă utilizatorul are plan Basic
      if (user?.id) {
        try {
          console.log("Fetching user plan information");
          const response = await fetch(`/api/user`);
          if (response.ok) {
            const userData = await response.json();
            console.log("User plan data:", userData);
            // Verifică dacă utilizatorul are plan Basic
            if (userData.planType === "Basic") {
              console.log("User has Basic plan, showing access denied");
              setShowAccessDenied(true);
              setLoading(false);
              return; // Nu mai încărcăm topicul dacă utilizatorul are plan Basic
            }
          } else {
            console.error("Error fetching user plan, status:", response.status);
          }
        } catch (error) {
          console.error("Error fetching user plan:", error);
        }
      }

      // Încarcă topicul dacă utilizatorul nu are plan Basic
      console.log("Proceeding to fetch topic");
      await fetchTopic();
    };

    // Încarcă datele (planul utilizatorului și topicul)
    loadData();
  }, [user, params.id]);

  useEffect(() => {
    if (!showAccessDenied) {
      fetchTopic();
    }
  }, [params.id, showAccessDenied]);

  // Funcție pentru a gestiona scrollarea automată la comentarii
  useEffect(() => {
    // Se execută după ce topicul este încărcat și pagina este randată
    if (topic && !loading && typeof window !== "undefined") {
      // Obținem hash-ul din URL
      const hash = window.location.hash;

      // Verificăm dacă există un hash și dacă acesta corespunde formatului nostru
      if (hash && hash.startsWith("#comment-")) {
        const commentId = hash.replace("#comment-", "");
        // Găsim elementul DOM și facem scroll către el
        const commentElement = document.getElementById(`comment-${commentId}`);

        if (commentElement) {
          // Adăugăm un timeout mic pentru a ne asigura că DOM-ul este complet încărcat
          setTimeout(() => {
            commentElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            // Adăugăm o evidențiere temporară
            commentElement.classList.add(
              "bg-yellow-100",
              "dark:bg-yellow-900/20"
            );
            setTimeout(() => {
              commentElement.classList.remove(
                "bg-yellow-100",
                "dark:bg-yellow-900/20"
              );
            }, 3000); // Eliminăm evidențierea după 3 secunde
          }, 300);
        }
      }
    }
  }, [topic, loading]);

  const fetchTopic = async () => {
    console.log("Starting fetchTopic function");
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching topic with ID:", params.id);
      const response = await fetch(`/api/forum/${params.id}`);
      console.log("Topic API response status:", response.status);

      if (response.status === 402 || response.status === 403) {
        console.log("Access denied for this topic");
        setShowAccessDenied(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          `${translations.error} ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Topic data received:", data);

      // Verificăm dacă avem datele despre topic în formatul așteptat
      // Putem avea fie {topic: {...}} sau direct obiectul topic
      const topicData = data.topic || data;

      if (!topicData || typeof topicData !== "object" || !topicData.id) {
        console.error("Invalid topic data format:", topicData);
        throw new Error(translations.notFound);
      }

      setTopic(topicData);
    } catch (err) {
      console.error("Error fetching topic:", err);
      setError(err instanceof Error ? err.message : String(err));
      // Nu mai redirectăm automat spre /forum, afișăm eroarea
      // router.push("/forum");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      alert(translations.commentEmpty);
      return;
    }

    setIsSubmitting(true);
    try {
      const censoredContent = censorText(newComment);
      const response = await fetch(`/api/forum/${params.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: censoredContent }),
      });

      if (response.ok) {
        setNewComment("");
        await fetchTopic();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim()) {
      alert(translations.replyEmpty);
      return;
    }

    setIsSubmitting(true);
    try {
      const censoredContent = censorText(replyContent);
      const response = await fetch(`/api/forum/${params.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: censoredContent,
          parentId: commentId,
        }),
      });

      if (response.ok) {
        setReplyContent("");
        setReplyTo(null);
        await fetchTopic();
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!topic) return;

    try {
      const response = await fetch(`/api/forum/${params.id}/favorite`, {
        method: "POST",
      });

      if (response.ok) {
        const { isFavorited } = await response.json();
        setTopic((prev) => (prev ? { ...prev, isFavorited } : null));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDeleteTopic = async () => {
    if (
      !topic ||
      !window.confirm("Are you sure you want to delete this topic?")
    )
      return;

    try {
      console.log("Attempting to delete topic:", {
        topicId: topic.id,
        isAdmin: isAdmin,
        userId: user?.id,
        topicUserId: topic.userId,
        isOwner: topic.isOwner,
      });

      const response = await fetch(`/api/forum/${params.id}`, {
        method: "DELETE",
      });

      console.log("Delete topic response status:", response.status);

      if (response.ok) {
        console.log("Topic deleted successfully, redirecting to forum");
        router.push("/forum");
      } else {
        const errorText = await response.text();
        console.error("Failed to delete topic:", errorText);
        alert("Failed to delete topic: " + errorText);
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
      alert("Error deleting topic: " + error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      const comment =
        topic?.comments.find((c) => c.id === commentId) ||
        topic?.comments
          .flatMap((c) => c.replies || [])
          .find((c) => c.id === commentId);

      console.log("Attempting to delete comment:", {
        commentId: commentId,
        isAdmin: isAdmin,
        userId: user?.id,
        commentUserId: comment?.userId,
        topicUserId: topic?.userId,
        isOwner: topic?.isOwner,
      });

      const response = await fetch(
        `/api/forum/${params.id}/comment/${commentId}`,
        {
          method: "DELETE",
        }
      );

      console.log("Delete comment response status:", response.status);

      if (response.ok) {
        console.log("Comment deleted successfully, refreshing topic");
        await fetchTopic();
      } else {
        const errorText = await response.text();
        console.error("Failed to delete comment:", errorText);
        alert("Failed to delete comment: " + errorText);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Error deleting comment: " + error);
    }
  };

  const sortComments = (comments: Comment[]) => {
    console.log("Sortare comentarii apelată cu opțiunea:", sortOption);
    console.log("Număr total comentarii primite:", comments?.length);

    // Verifică dacă avem comentarii valide
    if (!comments || !Array.isArray(comments)) {
      console.error("Comentariile primite nu sunt un array valid:", comments);
      return [];
    }

    // Filtreaza doar comentariile principale (nu și răspunsurile)
    const filteredComments = comments.filter((comment) => !comment.parentId);
    console.log(
      "Număr comentarii filtrate (fără replies):",
      filteredComments.length
    );

    let sortedComments;

    switch (sortOption) {
      case "relevance":
        console.log("Sortare după relevanță");
        sortedComments = [...filteredComments].sort(
          (a, b) => (b.replies?.length || 0) - (a.replies?.length || 0)
        );
        break;
      case "oldest":
        console.log("Sortare după cele mai vechi");
        sortedComments = [...filteredComments].sort((a, b) => {
          try {
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          } catch (error) {
            console.error("Eroare la sortarea după dată:", error);
            return 0;
          }
        });
        break;
      case "newest":
      default:
        console.log("Sortare după cele mai noi");
        sortedComments = [...filteredComments].sort((a, b) => {
          try {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          } catch (error) {
            console.error("Eroare la sortarea după dată:", error);
            return 0;
          }
        });
        break;
    }

    console.log("Comentarii sortate:", sortedComments?.length);
    return sortedComments;
  };

  // Efectul care se declanșează când opțiunea de sortare se schimbă
  useEffect(() => {
    console.log("Opțiunea de sortare s-a schimbat la:", sortOption);
    // Nu este nevoie să reîncărcăm topicul,
    // deoarece sortarea se face pe client-side cu datele existente
  }, [sortOption]);

  // Funcție pentru a gestiona schimbarea opțiunii de sortare
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Previne ca evenimentul să nu propage în sus spre formular
    e.preventDefault();
    e.stopPropagation();

    const newSortOption = e.target.value as "relevance" | "newest" | "oldest";
    console.log(
      "Schimbare opțiune sortare de la",
      sortOption,
      "la",
      newSortOption
    );
    setSortOption(newSortOption);
  };

  if (loading) {
    console.log("Rendering loading state");
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{translations.loading}</span>
      </div>
    );
  }

  if (error) {
    console.log("Rendering error state:", error);
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="text-red-500 mb-4">{error}</div>
        <Button variant="outline" onClick={() => router.push("/forum")}>
          {language === "ro" ? "Înapoi la Forum" : "Back to Forum"}
        </Button>
      </div>
    );
  }

  if (!topic && !showAccessDenied) {
    console.log("Topic is null and access is not denied, rendering null");
    return null;
  }

  console.log(
    "Rendering topic page, topic:",
    topic?.id,
    "showAccessDenied:",
    showAccessDenied
  );

  return (
    <>
      {!showAccessDenied && topic && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.back()}>
              Back to Forum
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  <UserTooltip
                    userId={topic.userId}
                    firstName={topic.user.firstName}
                    lastName={topic.user.lastName}
                    university={topic.user.university}
                    faculty={topic.user.faculty}
                    universityName={topic.user.universityName}
                    facultyName={topic.user.facultyName}
                    avatar={topic.user.avatar}
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src={topic.user.avatar || undefined} />
                        <AvatarFallback>
                          {topic.user.firstName?.[0]}
                          {topic.user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium hover:underline">
                          {topic.user.firstName} {topic.user.lastName}{" "}
                          <span className="text-gray-500 text-sm">(Autor)</span>
                        </p>
                      </div>
                    </div>
                  </UserTooltip>
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === "ro"
                    ? format(
                        new Date(topic.createdAt),
                        `PPP '${translations.at}' HH:mm`
                      )
                    : format(new Date(topic.createdAt), `PPP 'at' HH:mm`)}
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">{topic.title}</CardTitle>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{topic.facultyName || topic.faculty}</p>
                <p>{topic.universityName || topic.university}</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {topic.content || translations.noContent}
              </p>
              <div className="flex gap-2 mt-4">
                <ReportButton contentType="forum_topic" contentId={topic.id} />
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${
                    topic.isFavorited ? "text-yellow-500" : "text-gray-400"
                  } hover:text-yellow-500`}
                  onClick={handleFavoriteToggle}
                >
                  <Star
                    className={`h-5 w-5 ${
                      topic.isFavorited ? "fill-current" : ""
                    }`}
                  />
                </Button>
                {(topic.isOwner || isAdmin) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteTopic}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              {translations.comments} (
              {topic.comments.filter((c) => !c.parentId).length})
            </h2>

            <div className="flex items-center justify-between mb-4">
              <div></div> {/* Spațiu gol pentru aliniere */}
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <SortDesc className="h-4 w-4" />
                  <span className="mr-1">Sortează:</span>
                  <select
                    value={sortOption}
                    onChange={handleSortChange}
                    className="bg-transparent border-none focus:outline-none"
                  >
                    <option value="relevance">După relevanță</option>
                    <option value="newest">Cele mai noi</option>
                    <option value="oldest">Cele mai vechi</option>
                  </select>
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={translations.addComment}
                className="min-h-[100px]"
              />
              <Button type="submit" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {translations.post}
              </Button>
            </form>

            <div className="space-y-6">
              {topic.comments && topic.comments.length > 0 ? (
                <>
                  {(() => {
                    console.log(
                      "Încercare de afișare comentarii, înainte de sortare:",
                      topic.comments.length
                    );

                    // Verificăm structura comentariilor pentru a detecta probleme
                    const valid = topic.comments.every((c) => {
                      const hasValidId = typeof c.id === "string";
                      const hasValidCreatedAt = typeof c.createdAt === "string";
                      const isStructureValid = hasValidId && hasValidCreatedAt;

                      if (!isStructureValid) {
                        console.error("Comentariu cu structură invalidă:", c);
                      }

                      return isStructureValid;
                    });

                    if (!valid) {
                      console.error("Unele comentarii au structură invalidă!");
                    }

                    const sortedComments = sortComments(topic.comments);
                    console.log(
                      "Comentarii sortate pentru afișare:",
                      sortedComments.length
                    );

                    return sortedComments;
                  })().map((comment) => (
                    <div key={comment.id} className="space-y-4">
                      <Card
                        id={`comment-${comment.id}`}
                        className="transition-colors duration-300"
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <UserTooltip
                              userId={comment.userId}
                              firstName={comment.user.firstName}
                              lastName={comment.user.lastName}
                              university={comment.user.university}
                              faculty={comment.user.faculty}
                              universityName={comment.user.universityName}
                              facultyName={comment.user.facultyName}
                              avatar={comment.user.avatar}
                            >
                              <div className="flex items-center space-x-4 mb-4">
                                <Avatar>
                                  <AvatarImage
                                    src={comment.user.avatar || undefined}
                                  />
                                  <AvatarFallback>
                                    {comment.user.firstName?.[0]}
                                    {comment.user.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium hover:underline">
                                    {comment.user.firstName}{" "}
                                    {comment.user.lastName}
                                    {comment.userId === topic.userId && (
                                      <span className="text-yellow-500 text-sm ml-1">
                                        (Autor)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {comment.user.universityName ||
                                      comment.user.university}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {comment.user.facultyName ||
                                      comment.user.faculty}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(
                                      new Date(comment.createdAt),
                                      "PPP 'at' HH:mm"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </UserTooltip>
                            <div className="flex space-x-2">
                              <ReportButton
                                contentType="forum_comment"
                                contentId={comment.id}
                              />
                              {(user?.id === comment.userId ||
                                topic.isOwner ||
                                isAdmin) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="mb-4">{comment.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReplyTo(
                                replyTo === comment.id ? null : comment.id
                              )
                            }
                          >
                            <Reply className="h-4 w-4 mr-2" />
                            {translations.reply}
                          </Button>
                        </CardContent>
                      </Card>

                      {replyTo === comment.id && (
                        <div className="ml-12 space-y-4">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={translations.reply}
                          />
                          <div className="space-x-2">
                            <Button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={isSubmitting}
                              size="sm"
                            >
                              {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {translations.submitReply}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReplyTo(null);
                                setReplyContent("");
                              }}
                            >
                              {translations.cancel}
                            </Button>
                          </div>
                        </div>
                      )}

                      {comment.replies?.length > 0 && (
                        <div className="ml-12">
                          <CommentReplies
                            replies={comment.replies}
                            topicOwnerId={topic.userId}
                            onDeleteReply={handleDeleteComment}
                            isAdmin={isAdmin}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-muted-foreground">
                      {translations.noComments}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => {
          setShowAccessDenied(false);
          router.push("/forum");
        }}
        originalPath={`/forum/${params.id}`}
      />
    </>
  );
}
