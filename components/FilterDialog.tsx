"use client";

import { useState, useEffect, useMemo } from "react";
import { useUniversities } from "@/hooks/useUniversities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACADEMIC_CATEGORIES } from "@/lib/constants";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    university: string;
    faculty: string;
    category: string;
    studyLevel: string;
  }) => void;
  showCategoryFilter?: boolean;
  currentFilters?: {
    university: string;
    faculty: string;
    category: string;
    studyLevel: string;
  };
}

export default function FilterDialog({
  isOpen,
  onClose,
  onApplyFilters,
  showCategoryFilter = true,
  currentFilters,
}: FilterDialogProps) {
  const { universities, faculties, getUniversityName, getFacultyName } =
    useUniversities();
  const { language, forceRefresh } = useLanguage();

  // Translations for dialog with useMemo
  const translations = useMemo(() => {
    return {
      filterProjects:
        language === "ro" ? "Filtrează proiecte" : "Filter Projects",
      university: language === "ro" ? "Universitate" : "University",
      faculty: language === "ro" ? "Facultate" : "Faculty",
      category: language === "ro" ? "Categorie" : "Category",
      studyLevel: language === "ro" ? "Nivel de studii" : "Study Level",
      allUniversities:
        language === "ro" ? "Toate universitățile" : "All Universities",
      allFaculties: language === "ro" ? "Toate facultățile" : "All Faculties",
      allCategories: language === "ro" ? "Toate categoriile" : "All Categories",
      allStudyLevels: language === "ro" ? "Toate nivelele" : "All Levels",
      bachelors: language === "ro" ? "Licență" : "Bachelor's",
      masters: language === "ro" ? "Master" : "Master's",
      phd: language === "ro" ? "Doctorat" : "PhD",
      reset: language === "ro" ? "Resetează" : "Reset",
      cancel: language === "ro" ? "Anulează" : "Cancel",
      apply: language === "ro" ? "Aplică" : "Apply Filters",
    };
  }, [language, forceRefresh]);

  const defaultFilters = {
    university: "_all",
    faculty: "_all",
    category: "_all",
    studyLevel: "_all",
  };

  const [filters, setFilters] = useState(currentFilters || defaultFilters);

  // Initialize filters when dialog opens or when currentFilters changes
  useEffect(() => {
    if (isOpen && currentFilters) {
      setFilters(currentFilters);
    } else if (isOpen && !currentFilters) {
      setFilters(defaultFilters);
    }
  }, [isOpen, currentFilters]);

  // When university changes, reset faculty selection only if not coming from currentFilters
  useEffect(() => {
    // Skip this reset on initial render or if resetting to currentFilters
    const isInitialRender =
      filters.university ===
      (currentFilters?.university || defaultFilters.university);

    if (!isInitialRender && filters.university !== "_all") {
      setFilters((prev) => ({ ...prev, faculty: "_all" }));
    }
  }, [filters.university, currentFilters]);

  const handleApply = () => {
    console.log("Applying filters:", filters);

    // Check if we have any selected values to log data structure
    if (filters.university !== "_all") {
      const selectedUniversity = universities.find(
        (uni) => uni.id === filters.university
      );
      console.log("Selected university:", selectedUniversity);
    }

    if (filters.faculty !== "_all" && filters.university !== "_all") {
      const faculties =
        universities.find((uni) => uni.id === filters.university)?.faculties ||
        [];
      const selectedFaculty = faculties.find(
        (fac) => fac.id === filters.faculty
      );
      console.log("Selected faculty:", selectedFaculty);
    }

    // Apply filters and close the dialog
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{translations.filterProjects}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="university">{translations.university}</Label>
            <Select
              value={filters.university}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, university: value }))
              }
            >
              <SelectTrigger id="university">
                <SelectValue placeholder={translations.allUniversities} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">
                  {translations.allUniversities}
                </SelectItem>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty">{translations.faculty}</Label>
            <Select
              value={filters.faculty}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, faculty: value }))
              }
              disabled={filters.university === "_all"}
            >
              <SelectTrigger id="faculty">
                <SelectValue placeholder={translations.allFaculties} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">
                  {translations.allFaculties}
                </SelectItem>
                {filters.university !== "_all" &&
                  faculties
                    .filter(
                      (faculty) => faculty.universityId === filters.university
                    )
                    .map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          {showCategoryFilter && (
            <div className="space-y-2">
              <Label htmlFor="category">{translations.category}</Label>
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={translations.allCategories} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">
                    {translations.allCategories}
                  </SelectItem>
                  {ACADEMIC_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="studyLevel">{translations.studyLevel}</Label>
            <Select
              value={filters.studyLevel}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, studyLevel: value }))
              }
            >
              <SelectTrigger id="studyLevel">
                <SelectValue placeholder={translations.allStudyLevels} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">
                  {translations.allStudyLevels}
                </SelectItem>
                <SelectItem value="bachelors">
                  {translations.bachelors}
                </SelectItem>
                <SelectItem value="masters">
                  {translations.masters}
                </SelectItem>
                <SelectItem value="phd">
                  {translations.phd}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            {translations.reset}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {translations.cancel}
            </Button>
            <Button onClick={handleApply}>{translations.apply}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
