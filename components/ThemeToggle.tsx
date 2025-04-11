"use client";

import { LightbulbIcon as LightBulb, MoonStar } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageToggle";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { language, translations } = useLanguage();
  const t = translations[language as keyof typeof translations];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-full justify-start px-3 py-2"
    >
      <LightBulb className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonStar className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="ml-2">
        {theme === "light" ? t.darkMode : t.lightMode}
      </span>
    </Button>
  );
}
