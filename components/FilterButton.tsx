"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageToggle";

interface FilterButtonProps {
  onFilter: () => void;
  activeFiltersCount?: number;
}

export default function FilterButton({
  onFilter,
  activeFiltersCount = 0,
}: FilterButtonProps) {
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru butonul de filtrare cu useMemo
  const filterLabel = useMemo(() => {
    return language === "ro" ? "Filtrare" : "Filter";
  }, [language, forceRefresh]);

  return (
    <Button variant="outline" onClick={onFilter} className="relative">
      <Filter className="h-4 w-4 mr-2" />
      {filterLabel}
      {activeFiltersCount > 0 && (
        <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  );
}
