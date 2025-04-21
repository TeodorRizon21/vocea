"use client";

import { Globe } from "lucide-react";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Crează contextul pentru limbă cu versiunea de forțare a reîmprospătării
export const LanguageContext = createContext({
  language: "ro", // Implicit română
  setLanguage: (language: string) => {},
  forceRefresh: 0, // Valoarea pentru forțarea reîmprospătării
  translations: {
    ro: {
      home: "Acasă",
      browse: "Explorează",
      forum: "Forum",
      dashboard: "Panou",
      adminPanel: "Panou Administrator",
      projectsManagement: "Management Proiecte",
      reports: "Raportări",
      moderatorPanel: "Panou Moderator",
      newsManagement: "Management Știri",
      contactUs: "Contactează-ne",
      settings: "Setări",
      signOut: "Deconectare",
      signIn: "Conectare",
      signUp: "Înregistrare",
      darkMode: "Mod Întunecat",
      lightMode: "Mod Luminos",
      language: "Limbă",
    },
    en: {
      home: "Home",
      browse: "Browse",
      forum: "Forum",
      dashboard: "Dashboard",
      adminPanel: "Admin Panel",
      projectsManagement: "Projects Management",
      reports: "Reports",
      moderatorPanel: "Moderator Panel",
      newsManagement: "News Management",
      contactUs: "Contact Us",
      settings: "Settings",
      signOut: "Sign Out",
      signIn: "Sign In",
      signUp: "Sign Up",
      darkMode: "Dark Mode",
      lightMode: "Light Mode",
      language: "Language",
    },
  },
});

// Hook pentru utilizarea contextului de limbă
export const useLanguage = () => useContext(LanguageContext);

// Provider component pentru limbă
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState("ro"); // Implicit română
  const [mounted, setMounted] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0); // Stare pentru forțarea reîmprospătării

  useEffect(() => {
    // Verifică dacă există o limbă salvată în localStorage
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    setMounted(true);
  }, []);

  // Funcție pentru schimbarea limbii care declanșează și reîmprospătarea
  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    // Incrementează contorul pentru a forța reîmprospătarea componentelor
    setForceRefresh((prev) => prev + 1);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleLanguageChange,
        forceRefresh, // Adaugă contorul de forțare a reîmprospătării la context
        translations: {
          ro: {
            home: "Acasă",
            browse: "Explorează",
            forum: "Forum",
            dashboard: "Panou",
            adminPanel: "Panou Administrator",
            projectsManagement: "Management Proiecte",
            reports: "Raportări",
            moderatorPanel: "Panou Moderator",
            newsManagement: "Management Știri",
            contactUs: "Contactează-ne",
            settings: "Setări",
            signOut: "Deconectare",
            signIn: "Conectare",
            signUp: "Înregistrare",
            darkMode: "Mod Întunecat",
            lightMode: "Mod Luminos",
            language: "Limbă",
          },
          en: {
            home: "Home",
            browse: "Browse",
            forum: "Forum",
            dashboard: "Dashboard",
            adminPanel: "Admin Panel",
            projectsManagement: "Projects Management",
            reports: "Reports",
            moderatorPanel: "Moderator Panel",
            newsManagement: "News Management",
            contactUs: "Contact Us",
            settings: "Settings",
            signOut: "Sign Out",
            signIn: "Sign In",
            signUp: "Sign Up",
            darkMode: "Dark Mode",
            lightMode: "Light Mode",
            language: "Language",
          },
        },
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// Flag components cu fallback
const RomanianFlag = () => (
  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex items-center justify-center bg-[#FCD116]">
    <Image
      src="/flags/ro.svg"
      alt="Romanian flag"
      width={32}
      height={32}
      className="object-cover w-full h-full"
      onError={(e) => {
        // Fallback in case image fails to load
        const target = e.target as HTMLElement;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent) {
          // Create Romanian flag colors
          parent.innerHTML = `
            <div class="flex h-full">
              <div class="w-1/3 h-full bg-[#002B7F]"></div>
              <div class="w-1/3 h-full bg-[#FCD116]"></div>
              <div class="w-1/3 h-full bg-[#CE1126]"></div>
            </div>
          `;
        }
      }}
    />
  </div>
);

const UKFlag = () => (
  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex items-center justify-center bg-[#00247d]">
    <Image
      src="/flags/gb.svg"
      alt="UK flag"
      width={32}
      height={32}
      className="object-cover w-full h-full"
      onError={(e) => {
        // Fallback in case image fails to load
        const target = e.target as HTMLElement;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent) {
          // Create simplified UK flag
          parent.innerHTML = `
            <div class="relative w-full h-full bg-[#00247d] flex items-center justify-center">
              <div class="absolute w-full h-2 bg-white"></div>
              <div class="absolute h-full w-2 bg-white"></div>
            </div>
          `;
        }
      }}
    />
  </div>
);

// Componenta pentru butonul de schimbare a limbii
export function LanguageToggle() {
  const { language, setLanguage, translations, forceRefresh } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative w-full justify-start px-3 py-2 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
        >
          <Globe className="mr-2 h-[1.2rem] w-[1.2rem] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" />
          <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
            {language === "ro" ? "Limbă" : "Language"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="right"
        className="w-64 overflow-hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg"
        sideOffset={0}
        alignOffset={-12}
      >
        <div
          className={`transition-all duration-300 transform ${
            open
              ? "translate-x-0 opacity-100 scale-100"
              : "-translate-x-4 opacity-0 scale-95"
          }`}
        >
          <DropdownMenuItem
            onClick={() => setLanguage("ro")}
            className="p-3 flex items-center gap-3 cursor-pointer rounded-lg mb-1 transition-all duration-200
              hover:bg-indigo-50 dark:hover:bg-indigo-900/30
              focus:bg-indigo-50 dark:focus:bg-indigo-900/30
              hover:scale-[1.02] focus:scale-[1.02]"
          >
            <RomanianFlag />
            <div className="flex-1">
              <p className="font-medium text-base">Română</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Limba română
              </p>
            </div>
            {language === "ro" && (
              <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setLanguage("en")}
            className="p-3 flex items-center gap-3 cursor-pointer rounded-lg transition-all duration-200
              hover:bg-indigo-50 dark:hover:bg-indigo-900/30
              focus:bg-indigo-50 dark:focus:bg-indigo-900/30
              hover:scale-[1.02] focus:scale-[1.02]"
          >
            <UKFlag />
            <div className="flex-1">
              <p className="font-medium text-base">English</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                English language
              </p>
            </div>
            {language === "en" && (
              <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
