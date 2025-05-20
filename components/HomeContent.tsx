"use client";

import { useMemo, useEffect, useState } from "react";
import UserProfile from "@/components/UserProfile";
import NewsCarousel from "@/components/NewsCarousel";
import AboutUs from "@/components/AboutUs";
import { useLanguage } from "@/components/LanguageToggle";
import Image from "next/image";

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
      title: "Vocea Campusului – Locul ideilor studențești",
      latestNews: "Ultimele știri",
      aboutUs: "Despre noi",
    },
    en: {
      title: "Vocea Campusului – Where student's ideas come to life",
      latestNews: "Latest News",
      aboutUs: "About Us",
    },
  };

  // Folosim useMemo pentru a recalcula traducerile doar când limba sau forceRefresh se schimbă
  const t = useMemo(() => {
    return translations[language as keyof typeof translations];
  }, [language, forceRefresh]);

  // Responsive: show logo instead of title when navbar is hidden (mobile)
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex justify-center items-center">
        {isDesktop ? (
          <h1 className="font-bold text-purple-600 text-2xl sm:text-3xl md:text-4xl break-words">{t.title}</h1>
        ) : (
          <div className="relative w-[150px] h-[150px] bg-indigo-900 rounded-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/logo-vocea.png"
                alt="VOC Logo"
                width={150}
                height={150}
                className="object-contain"
                priority
              />
            </div>
          </div>
        )}
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
