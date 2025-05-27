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
  userId: string;
  type?: string;
  city?: string;
  academicYear?: string;
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
  userId,
  type,
  city,
  academicYear,
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
      city: language === "ro" ? "Oraș" : "City",
      academicYear: language === "ro" ? "An academic" : "Academic Year",
      academicYears: {
        "licenta-1": language === "ro" ? "Licență- Anul 1" : "Bachelor's- Year 1",
        "licenta-2": language === "ro" ? "Licență- Anul 2" : "Bachelor's- Year 2",
        "licenta-3": language === "ro" ? "Licență- Anul 3" : "Bachelor's- Year 3",
        "licenta-4": language === "ro" ? "Licență- Anul 4" : "Bachelor's- Year 4",
        "licenta-5": language === "ro" ? "Licență- Anul 5" : "Bachelor's- Year 5",
        "licenta-6": language === "ro" ? "Licență- Anul 6" : "Bachelor's- Year 6",
        "bachelors-1": language === "ro" ? "Licență- Anul 1" : "Bachelor's- Year 1",
        "bachelors-2": language === "ro" ? "Licență- Anul 2" : "Bachelor's- Year 2",
        "bachelors-3": language === "ro" ? "Licență- Anul 3" : "Bachelor's- Year 3",
        "bachelors-4": language === "ro" ? "Licență- Anul 4" : "Bachelor's- Year 4",
        "bachelors-5": language === "ro" ? "Licență- Anul 5" : "Bachelor's- Year 5",
        "bachelors-6": language === "ro" ? "Licență- Anul 6" : "Bachelor's- Year 6",
        "master-1": language === "ro" ? "Master- Anul 1" : "Master's- Year 1",
        "master-2": language === "ro" ? "Master- Anul 2" : "Master's- Year 2",
        "masters-1": language === "ro" ? "Master- Anul 1" : "Master's- Year 1",
        "masters-2": language === "ro" ? "Master- Anul 2" : "Master's- Year 2",
        "doctorat": language === "ro" ? "Doctorat" : "PhD",
        "phd": language === "ro" ? "Doctorat" : "PhD",
      },
    };
  }, [language, forceRefresh]);

  // Helper function to normalize academic year format
  const getAcademicYearTranslation = (year: string | undefined) => {
    if (!year) return "";
    
    // Convert the year to lowercase for case-insensitive comparison
    const normalizedYear = year.toLowerCase();
    
    // Try to get the translation directly
    const translation = translations.academicYears[normalizedYear as keyof typeof translations.academicYears];
    if (translation) return translation;
    
    // If no direct match, try to normalize the format
    if (normalizedYear.startsWith('bachelors-')) {
      const licentaYear = normalizedYear.replace('bachelors-', 'licenta-');
      return translations.academicYears[licentaYear as keyof typeof translations.academicYears] || year;
    }
    
    if (normalizedYear.startsWith('masters-')) {
      const masterYear = normalizedYear.replace('masters-', 'master-');
      return translations.academicYears[masterYear as keyof typeof translations.academicYears] || year;
    }
    
    // If no match found, return the original value
    return year;
  };

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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base md:text-lg line-clamp-2">{title}</h3>
            {studyLevel && (
              <Badge variant="outline" className="text-xs">
                {translations.studyLevels[studyLevel.toLowerCase() as keyof typeof translations.studyLevels]}
              </Badge>
            )}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{subject}</p>
          
          <div className="flex items-center space-x-2">
            <Avatar className="h-5 w-5 md:h-6 md:w-6">
              <AvatarImage src={authorAvatar || undefined} />
              <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs md:text-sm text-muted-foreground line-clamp-1">{displayName}</span>
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
            {type === "diverse" && city && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Tag className="h-3 w-3 mr-1" />
                <span className="line-clamp-1">{translations.city}: {city}</span>
              </div>
            )}
            {category === "manuale-carti" && academicYear && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Scroll className="h-3 w-3 mr-1" />
                <span className="line-clamp-1">{getAcademicYearTranslation(academicYear)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
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
