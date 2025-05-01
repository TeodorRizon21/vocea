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

interface NewsFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: { university: string; city: string }) => void;
  currentFilters: { university: string; city: string };
}

export default function NewsFilterDialog({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: NewsFilterDialogProps) {
  const { universities } = useUniversities();
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru dialogul de filtrare
  const translations = {
    ro: {
      dialogTitle: "Filtrare Știri",
      university: "Universitate",
      selectUniversity: "Selectează o universitate",
      allUniversities: "Toate Universitățile",
      city: "Oraș",
      selectCity: "Selectează un oraș",
      allCities: "Toate Orașele",
      reset: "Resetează",
      apply: "Aplică Filtrele",
      cities: [
        { id: "bucharest", name: "București" },
        { id: "cluj", name: "Cluj-Napoca" },
        { id: "iasi", name: "Iași" },
        { id: "timisoara", name: "Timișoara" },
        { id: "constanta", name: "Constanța" },
        { id: "brasov", name: "Brașov" },
        { id: "craiova", name: "Craiova" },
        { id: "galati", name: "Galați" },
        { id: "oradea", name: "Oradea" },
      ],
    },
    en: {
      dialogTitle: "Filter News",
      university: "University",
      selectUniversity: "Select a university",
      allUniversities: "All Universities",
      city: "City",
      selectCity: "Select a city",
      allCities: "All Cities",
      reset: "Reset",
      apply: "Apply Filters",
      cities: [
        { id: "bucharest", name: "Bucharest" },
        { id: "cluj", name: "Cluj-Napoca" },
        { id: "iasi", name: "Iași" },
        { id: "timisoara", name: "Timișoara" },
        { id: "constanta", name: "Constanța" },
        { id: "brasov", name: "Brașov" },
        { id: "craiova", name: "Craiova" },
        { id: "galati", name: "Galați" },
        { id: "oradea", name: "Oradea" },
      ],
    },
  };

  // Selectează traducerile în funcție de limba curentă folosind useMemo
  const t = useMemo(() => {
    return translations[language as keyof typeof translations];
  }, [language, forceRefresh]);

  // Initialize state with current filters or defaults
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    currentFilters.university || ""
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    currentFilters.city || ""
  );

  // Reset internal state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university || "");
      setSelectedCity(currentFilters.city || "");
    }
  }, [isOpen, currentFilters]);

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value);
  };

  const handleCityChange = (value: string) => {
    console.log("City selected:", value);
    setSelectedCity(value);
  };

  const handleApply = () => {
    console.log("Applying filters:", {
      university: selectedUniversity,
      city: selectedCity,
    });
    onApplyFilters({
      university: selectedUniversity,
      city: selectedCity,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedUniversity("");
    setSelectedCity("");
    onApplyFilters({
      university: "",
      city: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="university" className="text-right">
              {t.university}
            </Label>
            <Select
              value={selectedUniversity}
              onValueChange={handleUniversityChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t.selectUniversity} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allUniversities}</SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              {t.city}
            </Label>
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t.selectCity} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCities}</SelectItem>
                {t.cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            {t.reset}
          </Button>
          <Button onClick={handleApply}>{t.apply}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
