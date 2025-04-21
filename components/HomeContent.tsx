"use client";

import { useMemo } from "react";
import UserProfile from "@/components/UserProfile";
import NewsCarousel from "@/components/NewsCarousel";
import AboutUs from "@/components/AboutUs";
import { useLanguage } from "@/components/LanguageToggle";

// Define the News type
interface News {
  id: string;
  title: string;
  description: string;
  image: string;
  university?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HomeContentProps {
  news: News[];
}

export default function HomeContent({ news }: HomeContentProps) {
  const { language, forceRefresh } = useLanguage();

  // Texte traduse
  const translations = {
    ro: {
      title: "Vocea campusului",
      latestNews: "Ultimele știri",
      aboutUs: "Despre noi",
    },
    en: {
      title: "Campus Voice",
      latestNews: "Latest News",
      aboutUs: "About Us",
    },
  };

  // Folosim useMemo pentru a recalcula traducerile doar când limba sau forceRefresh se schimbă
  const t = useMemo(() => {
    return translations[language as keyof typeof translations];
  }, [language, forceRefresh]);

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">{t.title}</h1>
        <UserProfile />
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">{t.latestNews}</h2>
        <NewsCarousel news={news} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">{t.aboutUs}</h2>
        <AboutUs />
      </section>
    </div>
  );
}
