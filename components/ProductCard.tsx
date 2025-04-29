"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, GraduationCap, BookOpen, Tag, Scroll } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageToggle";
import { useMemo } from "react";

interface ProductCardProps {
  title: string;
  subject: string;
  thumbnailUrl: string;
  authorFirstName?: string | null;
  authorLastName?: string | null;
  authorAvatar?: string | null;
  university: string;
  faculty: string;
  category?: string;
  studyLevel?: string;
  reviews: Array<{ score: number }>;
  userId: string; // Added userId prop
}

export default function ProductCard({
  title,
  subject,
  thumbnailUrl,
  authorFirstName,
  authorLastName,
  authorAvatar,
  university,
  faculty,
  category,
  studyLevel,
  reviews,
  userId, // Added userId parameter
}: ProductCardProps) {
  const { language, forceRefresh } = useLanguage();

  // Translations for the card
  const translations = useMemo(() => {
    return {
      studyLevels: {
        bachelors: language === "ro" ? "Licență" : "Bachelor's",
        masters: language === "ro" ? "Master" : "Master's",
        phd: language === "ro" ? "Doctorat" : "PhD",
      },
    };
  }, [language, forceRefresh]);

  const averageRating = reviews.reduce((acc, review) => acc + review.score, 0) / reviews.length || 0;
  const displayName = `${authorFirstName || ""} ${authorLastName || ""}`.trim() || "Anonymous";

  return (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative h-48">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{subject}</p>
          
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={authorAvatar || undefined} />
              <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground line-clamp-1">{displayName}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <GraduationCap className="h-3 w-3 mr-1" />
              <span className="line-clamp-1">{university}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3 mr-1" />
              <span className="line-clamp-1">{faculty}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>{averageRating.toFixed(1)}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
