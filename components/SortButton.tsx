"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";
import { useMemo } from "react";

interface SortButtonProps {
  onSort: () => void;
  direction?: "asc" | "desc";
}

export default function SortButton({
  onSort,
  direction = "desc",
}: SortButtonProps) {
  const { language, forceRefresh } = useLanguage();

  const sortLabel = useMemo(() => {
    return language === "ro" ? "Sortează" : "Sort";
  }, [language, forceRefresh]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Previne propagarea evenimentului pentru a evita alte interacțiuni nedorite
    e.preventDefault();
    e.stopPropagation();

    console.log("SortButton: handleClick triggering onSort");
    onSort();
  };

  // Alege iconița în funcție de direcția de sortare
  const SortIcon = useMemo(() => {
    if (!direction) return ArrowUpDown;
    return direction === "asc" ? ArrowUp : ArrowDown;
  }, [direction]);

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className="flex items-center"
      type="button"
    >
      <SortIcon className="mr-2 h-4 w-4" />
      {sortLabel}
    </Button>
  );
}
