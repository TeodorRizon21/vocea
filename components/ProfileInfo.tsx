"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, MapPin, Calendar, Star, Edit } from "lucide-react";
import { useUniversities } from "@/hooks/useUniversities";
import { useLanguage } from "@/components/LanguageToggle";
import { useMemo } from "react";

interface ProfileInfoProps {
  firstName: string;
  lastName: string;
  university: string;
  faculty: string;
  city: string;
  year: string;
  reviewScore: number;
  onEdit: () => void;
}

export default function ProfileInfo({
  firstName,
  lastName,
  university,
  faculty,
  city,
  year,
  reviewScore,
  onEdit,
}: ProfileInfoProps) {
  const { getUniversityName, getFacultyName, universities } = useUniversities();
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru componenta
  const translations = useMemo(() => {
    return {
      myProfile: language === "ro" ? "Profilul meu" : "My Profile",
      universityNotSet:
        language === "ro" ? "Universitate nesetată" : "University not set",
      facultyNotSet:
        language === "ro" ? "Facultate nesetată" : "Faculty not set",
      notSet: language === "ro" ? "Nesetat" : "Not set",
    };
  }, [language, forceRefresh]);

  // Add console logging for debugging
  console.log("ProfileInfo received university:", university);
  console.log("ProfileInfo received faculty:", faculty);

  // Check if the university value is an ID or a name
  const isUniversityId = university?.startsWith("uni_");
  const isFacultyId = faculty?.startsWith("fac_");

  console.log("Is university ID?", isUniversityId);
  console.log("Is faculty ID?", isFacultyId);

  // If it's an ID, use the lookup function; otherwise, display the name directly
  const universityDisplay =
    !university ||
    university === "Not set" ||
    university === "University not set"
      ? translations.universityNotSet
      : isUniversityId
      ? getUniversityName(university) || university
      : university;

  const facultyDisplay =
    !faculty || faculty === "Not set" || faculty === "Faculty not set"
      ? translations.facultyNotSet
      : isFacultyId
      ? getFacultyName(university || "", faculty) || faculty
      : faculty;

  console.log("Final university display:", universityDisplay);
  console.log("Final faculty display:", facultyDisplay);

  // Procesează celelalte valori pentru a afișa "Nesetat" în română sau "Not set" în engleză
  const firstNameDisplay =
    firstName === "Not set" ? translations.notSet : firstName;
  const lastNameDisplay =
    lastName === "Not set" ? translations.notSet : lastName;
  const cityDisplay = city === "Not set" ? translations.notSet : city;
  const yearDisplay = useMemo(() => {
    if (year === "Not set") return translations.notSet;
    
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) return year;

    if (language === "ro") {
      if (yearNum <= 4) return `Licență anul ${year}`;
      if (yearNum === 5) return `Masterat`;
      return `Doctorat`;
    } else {
      if (yearNum <= 4) return `Bachelor's Year ${year}`;
      if (yearNum === 5) return `Masters`;
      return `PhD`;
    }
  }, [year, language, translations.notSet]);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{translations.myProfile}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center">
          <School className="mr-2 h-4 w-4 text-purple-600 flex-shrink-0" />
          <span className="break-words">
            {firstNameDisplay} {lastNameDisplay}
          </span>
        </div>
        <div className="flex items-center">
          <School className="mr-2 h-4 w-4 text-purple-600 flex-shrink-0" />
          <span className="break-words">{universityDisplay}</span>
        </div>
        <div className="flex items-center">
          <School className="mr-2 h-4 w-4 text-purple-600 flex-shrink-0" />
          <span className="break-words">{facultyDisplay}</span>
        </div>
        <div className="flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-purple-600 flex-shrink-0" />
          <span className="break-words">{cityDisplay}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-purple-600 flex-shrink-0" />
          <span className="break-words">{yearDisplay}</span>
        </div>
        {/*<div className="flex items-center">
          <Star className="mr-2 h-4 w-4 text-purple-600" />
          <span>Review Score: {reviewScore}</span>
        </div>
        */}
      </CardContent>
    </Card>
  );
}
