"use client";

import type React from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, Star, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import UserTooltip from "./UserTooltip";
import ReportButton from "@/components/ReportButton";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/components/LanguageToggle";

interface TopicCardProps {
  id: string;
  title: string;
  university: string;
  faculty: string;
  universityName?: string;
  facultyName?: string;
  comments: number;
  commenters: number;
  createdAt: Date;
  isFavorited: boolean;
  isOwner: boolean;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    university: string | null;
    faculty: string | null;
    universityName?: string | null;
    facultyName?: string | null;
    avatar?: string | null;
  };
  onFavoriteToggle: (topicId: string) => Promise<void>;
  onDelete?: (topicId: string) => Promise<void>;
}

export default function TopicCard({
  id,
  title,
  university,
  faculty,
  universityName,
  facultyName,
  comments,
  commenters,
  createdAt,
  isFavorited,
  isOwner,
  author,
  onFavoriteToggle,
  onDelete,
}: TopicCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru componenta cu useMemo
  const translations = useMemo(() => {
    return {
      comments: language === "ro" ? "comentarii" : "comments",
      people: language === "ro" ? "persoane au comentat" : "people commented",
      at: language === "ro" ? "la" : "at",
      deleteConfirm:
        language === "ro"
          ? "Ești sigur că vrei să ștergi acest subiect?"
          : "Are you sure you want to delete this topic?",
    };
  }, [language, forceRefresh]);

  useEffect(() => {
    if (user) {
      // Check for admin role in public metadata
      const publicMetadata = user.publicMetadata;
      setIsAdmin(publicMetadata.isAdmin === true);
    }
  }, [user]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onFavoriteToggle(id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (!onDelete || !window.confirm(translations.deleteConfirm)) return;

    setIsLoading(true);
    try {
      await onDelete(id);
    } finally {
      setIsLoading(false);
    }
  };

  // Folosim numele universității și facultății dacă sunt disponibile, altfel folosim ID-urile
  const displayUniversity = universityName || university;
  const displayFaculty = facultyName || faculty;

  // Formatare dată în funcție de limbă
  const formattedDate = useMemo(() => {
    // Pentru română: "15 mai 2023 la 13:45"
    if (language === "ro") {
      const date = format(new Date(createdAt), "PPP");
      const time = format(new Date(createdAt), "HH:mm");
      return `${date} ${translations.at} ${time}`;
    }
    // Pentru engleză: "May 15, 2023 at 13:45"
    return format(new Date(createdAt), `PPP '${translations.at}' HH:mm`);
  }, [createdAt, language, translations]);

  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow relative group">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <UserTooltip
                userId={author.id}
                firstName={author.firstName}
                lastName={author.lastName}
                university={author.university}
                faculty={author.faculty}
                universityName={author.universityName}
                facultyName={author.facultyName}
                avatar={author.avatar}
              >
                <span className="hover:underline">
                  {author.firstName} {author.lastName}
                </span>
              </UserTooltip>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
            <p className="text-sm text-muted-foreground">{displayUniversity}</p>
            <p className="text-sm text-muted-foreground">{displayFaculty}</p>
          </div>
          <div className="flex gap-2">
            <ReportButton contentType="forum_topic" contentId={id} />
            <Button
              variant="ghost"
              size="icon"
              className={`${
                isFavorited ? "text-yellow-500" : "text-gray-400"
              } hover:text-yellow-500`}
              onClick={handleFavoriteClick}
              disabled={isLoading}
            >
              <Star
                className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`}
              />
            </Button>
            {(isOwner || isAdmin) && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MessageSquare className="mr-1 h-4 w-4" />
            <span>
              {comments} {translations.comments}
            </span>
          </div>
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            <span>
              {commenters} {translations.people}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
