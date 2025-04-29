import { format } from "date-fns";
import { useLanguage } from "@/components/LanguageToggle";
import { useMemo } from "react";

interface DashboardHeroProps {
  name: string;
}

export default function DashboardHero({ name }: DashboardHeroProps) {
  const { language, forceRefresh } = useLanguage();
  const today = useMemo(() => {
    // Alegem diferite formate în funcție de limbă
    const dateFormat = language === "ro" ? "d MMMM yyyy" : "MMMM d, yyyy";
    return format(new Date(), dateFormat);
  }, [language]);

  const displayName = name || "Guest";

  // Traduceri pentru mesajul de bun venit
  const welcomeMessage = useMemo(() => {
    return language === "ro"
      ? `Bine ai revenit, ${displayName}!`
      : `Welcome back, ${displayName}!`;
  }, [language, displayName, forceRefresh]);

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white p-8 rounded-lg">
      <p className="text-sm mb-4">{today}</p>
      <h2 className="text-3xl font-bold">{welcomeMessage}</h2>
    </div>
  );
}
