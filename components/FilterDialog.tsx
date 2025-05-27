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
    city: string;
  }) => void;
  showCategoryFilter?: boolean;
  showCityFilter?: boolean;
  currentFilters?: {
    university: string;
    faculty: string;
    category: string;
    studyLevel: string;
    city: string;
  };
  availableCities?: string[];
}

export default function FilterDialog({
  isOpen,
  onClose,
  onApplyFilters,
  showCategoryFilter = true,
  showCityFilter = false,
  currentFilters,
  availableCities = [],
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
      city: language === "ro" ? "Oraș" : "City",
      allUniversities:
        language === "ro" ? "Toate universitățile" : "All Universities",
      allFaculties: language === "ro" ? "Toate facultățile" : "All Faculties",
      allCategories: language === "ro" ? "Toate categoriile" : "All Categories",
      allStudyLevels: language === "ro" ? "Toate nivelele" : "All Levels",
      allCities: language === "ro" ? "Toate orașele" : "All Cities",
      bachelors: language === "ro" ? "Licență" : "Bachelor's",
      masters: language === "ro" ? "Master" : "Master's",
      phd: language === "ro" ? "Doctorat" : "PhD",
      reset: language === "ro" ? "Resetează" : "Reset",
      cancel: language === "ro" ? "Anulează" : "Cancel",
      apply: language === "ro" ? "Aplică" : "Apply Filters",
      academicCategories: {
        "Mathematics": language === "ro" ? "Matematică" : "Mathematics",
        "Physics": language === "ro" ? "Fizică" : "Physics",
        "Computer Science": language === "ro" ? "Informatică" : "Computer Science",
        "Engineering": language === "ro" ? "Inginerie" : "Engineering",
        "Chemistry": language === "ro" ? "Chimie" : "Chemistry",
        "Economics": language === "ro" ? "Economie" : "Economics",
        "Medicine": language === "ro" ? "Medicină" : "Medicine",
        "Law": language === "ro" ? "Drept" : "Law",
        "Social Sciences": language === "ro" ? "Științe Sociale" : "Social Sciences",
        "Arts and Humanities": language === "ro" ? "Arte și Științe Umaniste" : "Arts and Humanities",
        "Business and Management": language === "ro" ? "Business și Management" : "Business and Management"
      }
    };
  }, [language, forceRefresh]);

  const defaultFilters = {
    university: "_all",
    faculty: "_all",
    category: "_all",
    studyLevel: "_all",
    city: "_all",
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

  // Reset faculty when university changes
  useEffect(() => {
    if (filters.university === "_all") {
      setFilters(prev => ({ ...prev, faculty: "_all" }));
    }
  }, [filters.university]);

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
      <DialogContent className="w-[95vw] max-w-[425px] px-3 sm:px-6">
        <DialogHeader>
          <DialogTitle>{translations.filterProjects}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* University and Faculty Selection Group */}
          <div className="space-y-4 border-b pb-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="university" className="text-right text-sm">
                {translations.university}
              </Label>
              <Select
                value={filters.university}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, university: value }))
                }
              >
                <SelectTrigger id="university" className="col-span-3 h-9">
                  <SelectValue placeholder={translations.allUniversities} className="text-sm truncate max-w-[180px]" />
                </SelectTrigger>
                <SelectContent 
                  className="w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[var(--radix-select-trigger-width)] sm:max-w-[450px]"
                  position="popper"
                  side="bottom"
                  align="start"
                >
                  <SelectItem value="_all">
                    {translations.allUniversities}
                  </SelectItem>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id} className="py-2">
                      <div className="flex flex-col">
                        <span className="text-[13px] leading-tight whitespace-normal">{uni.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="faculty" className="text-right text-sm">
                {translations.faculty}
              </Label>
              <Select
                value={filters.faculty}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, faculty: value }))
                }
                disabled={filters.university === "_all"}
              >
                <SelectTrigger id="faculty" className="col-span-3 h-9">
                  <SelectValue placeholder={translations.allFaculties} className="text-sm" />
                </SelectTrigger>
                <SelectContent 
                  className="w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[var(--radix-select-trigger-width)] sm:max-w-[450px]"
                  position="popper"
                  side="bottom"
                  align="start"
                >
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
                          <span className="text-sm whitespace-normal">{faculty.name}</span>
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Other Filters Group */}
          <div className="space-y-4">
            {showCityFilter && (
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="city" className="text-right text-sm">
                  {translations.city}
                </Label>
                <Select
                  value={filters.city}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, city: value }))
                  }
                >
                  <SelectTrigger id="city" className="col-span-3 h-9">
                    <SelectValue placeholder={translations.allCities} className="text-sm" />
                  </SelectTrigger>
                  <SelectContent 
                    className="w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[var(--radix-select-trigger-width)] sm:max-w-[450px]"
                    position="popper"
                    side="bottom"
                    align="start"
                  >
                    <SelectItem value="_all">
                      {translations.allCities}
                    </SelectItem>
                    {[...new Set(universities.map(uni => uni.city))].sort().map((city) => (
                      <SelectItem key={city} value={city}>
                        <span className="text-sm">{city}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showCategoryFilter && (
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="category" className="text-right text-sm">
                  {translations.category}
                </Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger id="category" className="col-span-3 h-9">
                    <SelectValue placeholder={translations.allCategories} className="text-sm" />
                  </SelectTrigger>
                  <SelectContent 
                    className="w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[var(--radix-select-trigger-width)] sm:max-w-[450px]"
                    position="popper"
                    side="bottom"
                    align="start"
                  >
                    <SelectItem value="_all">
                      {translations.allCategories}
                    </SelectItem>
                    {ACADEMIC_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        <span className="text-sm">{translations.academicCategories[category as keyof typeof translations.academicCategories] || category}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="studyLevel" className="text-right text-sm">
                {translations.studyLevel}
              </Label>
              <Select
                value={filters.studyLevel}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, studyLevel: value }))
                }
              >
                <SelectTrigger id="studyLevel" className="col-span-3 h-9">
                  <SelectValue placeholder={translations.allStudyLevels} className="text-sm" />
                </SelectTrigger>
                <SelectContent 
                  className="w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[var(--radix-select-trigger-width)] sm:max-w-[450px]"
                  position="popper"
                  side="bottom"
                  align="start"
                >
                  <SelectItem value="_all">
                    {translations.allStudyLevels}
                  </SelectItem>
                  <SelectItem value="bachelors">
                    <span className="text-sm">{translations.bachelors}</span>
                  </SelectItem>
                  <SelectItem value="masters">
                    <span className="text-sm">{translations.masters}</span>
                  </SelectItem>
                  <SelectItem value="phd">
                    <span className="text-sm">{translations.phd}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Button variant="outline" onClick={onClose} size="sm">
              {translations.cancel}
            </Button>
            <Button onClick={handleApply} size="sm">
              {translations.apply}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
