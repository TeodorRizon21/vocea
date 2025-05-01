"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterButton from "@/components/FilterButton";
import NewsFilterDialog from "@/components/NewsFilterDialog";
import { useUniversities } from "@/hooks/useUniversities";
import { useLanguage } from "@/components/LanguageToggle";

interface News {
  id: string;
  title: string;
  description: string;
  image: string;
  university?: string;
  city?: string;
  createdAt: Date;
}

interface NewsCarouselProps {
  news: News[];
}

export default function NewsCarousel({ news }: NewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allNews, setAllNews] = useState<News[]>(news);
  const [filteredNews, setFilteredNews] = useState<News[]>(news);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    university: "",
    city: "",
  });
  const { getUniversityName } = useUniversities();
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru interfață
  const translations = {
    ro: {
      noNews: "Nu s-au găsit știri care să corespundă filtrelor tale.",
      clearFilters: "Șterge Filtrele",
    },
    en: {
      noNews: "No news found matching your filters.",
      clearFilters: "Clear Filters",
    },
  };

  // Selectează traducerile în funcție de limba curentă folosind useMemo
  const t = useMemo(() => {
    return translations[language as keyof typeof translations];
  }, [language, forceRefresh]);

  useEffect(() => {
    // Apply filters
    let filtered = [...allNews];

    if (filters.university && filters.university !== "all") {
      filtered = filtered.filter(
        (item) => item.university === filters.university
      );
    }

    if (filters.city && filters.city !== "all") {
      console.log("Filtering by city:", filters.city);
      console.log("Available cities in news:", filtered.map(item => item.city));
      
      // Map of city IDs to their Romanian names
      const cityMap = {
        bucharest: "București",
        cluj: "Cluj-Napoca",
        iasi: "Iași",
        timisoara: "Timișoara",
        constanta: "Constanța",
        brasov: "Brașov",
        craiova: "Craiova",
        galati: "Galați",
        oradea: "Oradea"
      };

      const romanianCityName = cityMap[filters.city as keyof typeof cityMap];
      
      filtered = filtered.filter((item) => {
        const itemCity = item.city?.trim() || "";
        console.log("Comparing:", itemCity, "with", romanianCityName);
        return itemCity === romanianCityName;
      });
    }

    console.log("Filtered news count:", filtered.length);
    setFilteredNews(filtered);

    // Reset current index if we filtered out the current news item
    if (filtered.length > 0 && currentIndex >= filtered.length) {
      setCurrentIndex(0);
    } else if (filtered.length === 0) {
      setCurrentIndex(0);
    }
  }, [filters, allNews, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? filteredNews.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === filteredNews.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleApplyFilters = (newFilters: {
    university: string;
    city: string;
  }) => {
    setFilters(newFilters);
    setCurrentIndex(0); // Reset to first item when filters change
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value && value !== "all"
  ).length;

  if (filteredNews.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t.noNews}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setFilters({ university: "", city: "" });
            setCurrentIndex(0);
          }}
        >
          {t.clearFilters}
        </Button>
      </div>
    );
  }

  const currentNews = filteredNews[currentIndex];

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10">
        <FilterButton
          onFilter={() => setIsFilterDialogOpen(true)}
          activeFiltersCount={activeFiltersCount}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row items-center">
          {/* Image on the left */}
          {currentNews.image && (
            <div className="relative w-full md:w-2/5 h-80 md:h-[400px] flex items-center justify-center">
              <Image
                src={
                  currentNews.image || "/placeholder.svg?height=600&width=600"
                }
                alt={currentNews.title}
                fill
                style={{ objectFit: "contain" }}
                className="p-4"
              />
            </div>
          )}

          {/* Content on the right */}
          <div className="w-full md:w-3/5 p-6 space-y-4 self-center">
            <h3 className="text-xl font-semibold">{currentNews.title}</h3>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              {currentNews.city && currentNews.city !== "oricare" && (
                <span className="font-medium">{currentNews.city}</span>
              )}
              {currentNews.university &&
                currentNews.university !== "oricare" && (
                  <>
                    {currentNews.city && currentNews.city !== "oricare" && (
                      <span className="mx-1">•</span>
                    )}
                    <span>{getUniversityName(currentNews.university)}</span>
                  </>
                )}
            </div>
            <div className="max-h-[300px] overflow-y-auto pr-2">
              <p className="text-muted-foreground">{currentNews.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-gray-500">
          {currentIndex + 1} / {filteredNews.length}
        </div>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <NewsFilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </div>
  );
}
