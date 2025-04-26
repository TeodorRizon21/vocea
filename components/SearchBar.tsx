"use client";

import type React from "react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const { language, forceRefresh } = useLanguage();

  const placeholder = useMemo(() => {
    return language === "ro" ? "Caută subiect..." : "Search topics...";
  }, [language, forceRefresh]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-4 py-2 w-full rounded-full border-2 border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
      />
      <button
        type="submit"
        className="absolute left-3 top-1/2 transform -translate-y-1/2"
      >
        <Search className="h-5 w-5 text-purple-600" />
      </button>
    </form>
  );
}
