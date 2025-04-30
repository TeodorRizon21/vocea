"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUniversities } from "@/hooks/useUniversities";
import { useLanguage } from "@/components/LanguageToggle";

interface ForumFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    university: string;
    faculty: string;
    city: string;
    category: string;
  }) => void;
  currentFilters: { university: string; faculty: string; city: string; category: string };
}

export default function ForumFilterDialog({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: ForumFilterDialogProps) {
  const {
    universities,
    faculties,
    getUniversityName,
    getFacultyName,
  } = useUniversities();
  const { language, forceRefresh } = useLanguage();

  // Translations for dialog with useMemo
  const translations = useMemo(() => {
    return {
      filterTopics:
        language === "ro" ? "Filtrează subiecte" : "Filter Forum Topics",
      university: language === "ro" ? "Universitate" : "University",
      faculty: language === "ro" ? "Facultate" : "Faculty",
      city: language === "ro" ? "Oraș" : "City",
      category: language === "ro" ? "Categorie" : "Category",
      selectUniversity:
        language === "ro" ? "Selectează o universitate" : "Select a university",
      selectFaculty:
        language === "ro" ? "Selectează o facultate" : "Select a faculty",
      selectCity:
        language === "ro" ? "Selectează un oraș" : "Select a city",
      selectUniversityFirst:
        language === "ro"
          ? "Selectează mai întâi universitatea"
          : "Select university first",
      selectCategory:
        language === "ro" ? "Selectează o categorie" : "Select a category",
      allUniversities:
        language === "ro" ? "Toate universitățile" : "All Universities",
      allFaculties: language === "ro" ? "Toate facultățile" : "All Faculties",
      allCities: language === "ro" ? "Toate orașele" : "All Cities",
      allCategories: language === "ro" ? "Toate categoriile" : "All Categories",
      reset: language === "ro" ? "Resetează" : "Reset",
      apply: language === "ro" ? "Aplică" : "Apply Filters",
      general: language === "ro" ? "General" : "General",
      academic: language === "ro" ? "Academic" : "Academic",
      events: language === "ro" ? "Evenimente" : "Events",
      housing: language === "ro" ? "Cazare" : "Housing",
      jobs: language === "ro" ? "Joburi & Stagii" : "Jobs & Internships",
      social: language === "ro" ? "Social" : "Social",
      gaming: language === "ro" ? "Gaming" : "Gaming",
    };
  }, [language, forceRefresh]);

  // Forum categories with translations
  const categories = useMemo(
    () => [
      { id: "general", name: language === "ro" ? "General" : "General" },
      { id: "academic", name: language === "ro" ? "Academic" : "Academic" },
      { id: "events", name: language === "ro" ? "Evenimente" : "Events" },
      { id: "housing", name: language === "ro" ? "Cazare" : "Housing" },
      { id: "jobs", name: language === "ro" ? "Joburi & Stagii" : "Jobs & Internships" },
      { id: "social", name: language === "ro" ? "Social" : "Social" },
      { id: "gaming", name: language === "ro" ? "Gaming" : "Gaming" },
    ],
    [language]
  );

  // Initialize state with current filters or defaults
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    currentFilters.university || ""
  );
  const [selectedFaculty, setSelectedFaculty] = useState<string>(
    currentFilters.faculty || ""
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    currentFilters.city || ""
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    currentFilters.category || ""
  );

  // Reset internal state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university || "");
      setSelectedFaculty(currentFilters.faculty || "");
      setSelectedCity(currentFilters.city || "");
      setSelectedCategory(currentFilters.category || "");
    }
  }, [isOpen, currentFilters]);

  // Memoize available faculties and cities
  const availableFaculties = useMemo(() => {
    if (selectedUniversity && selectedUniversity !== "all") {
      return faculties.filter(
        (faculty) => faculty.universityId === selectedUniversity
      );
    }
    return faculties;
  }, [selectedUniversity, faculties]);

  const availableCities = useMemo(() => {
    const uniqueCities = new Set<string>();
    universities.forEach((university) => {
      if (university.city) {
        uniqueCities.add(university.city);
      }
    });
    return Array.from(uniqueCities).sort();
  }, [universities]);

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value);
    setSelectedFaculty(""); // Reset faculty when university changes
    if (value === "all") {
      setSelectedFaculty("all");
    }
  };

  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    if (value === "all") {
      setSelectedUniversity("all");
      setSelectedFaculty("all");
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleApply = () => {
    const filters = {
      university: selectedUniversity === "all" ? "" : selectedUniversity,
      faculty: selectedFaculty === "all" ? "" : selectedFaculty,
      city: selectedCity === "all" ? "" : selectedCity,
      category: selectedCategory === "all" ? "" : selectedCategory,
    };

    console.log("Applying filters:", {
      selectedUniversity,
      selectedFaculty,
      selectedCity,
      selectedCategory,
      appliedFilters: filters,
    });

    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setSelectedUniversity("");
    setSelectedFaculty("");
    setSelectedCity("");
    setSelectedCategory("");
    onApplyFilters({
      university: "",
      faculty: "",
      city: "",
      category: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle>{translations.filterTopics}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="university" className="text-right">
              {translations.university}
            </Label>
            <Select
              value={selectedUniversity}
              onValueChange={handleUniversityChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={translations.selectUniversity} />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[300px]">
                <SelectItem value="all">
                  {translations.allUniversities}
                </SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={university.id} className="py-2">
                    <div className="flex flex-col">
                      <span className="whitespace-normal break-words leading-snug">{university.name}</span>
                      <span className="text-xs text-muted-foreground">{university.city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="faculty" className="text-right">
              {translations.faculty}
            </Label>
            <Select
              value={selectedFaculty}
              onValueChange={handleFacultyChange}
              disabled={!selectedUniversity || selectedUniversity === ""}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue
                  placeholder={
                    selectedUniversity
                      ? translations.selectFaculty
                      : translations.selectUniversityFirst
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allFaculties}</SelectItem>
                {availableFaculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              {translations.city}
            </Label>
            <Select
              value={selectedCity}
              onValueChange={handleCityChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={translations.selectCity} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allCities}</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              {translations.category}
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={translations.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {translations.allCategories}
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            {translations.reset}
          </Button>
          <Button onClick={handleApply}>{translations.apply}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
