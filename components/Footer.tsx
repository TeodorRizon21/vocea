"use client"

import Link from "next/link"
import { useLanguage } from "@/components/LanguageToggle"
import { useMemo } from "react"

export default function Footer() {
  const { language, forceRefresh } = useLanguage()

  const translations = useMemo(() => {
    return {
      copyright: language === "ro" ? "© {year} VOC. Toate drepturile rezervate." : "© {year} VOC. All rights reserved.",
      terms: language === "ro" ? "Termeni și Condiții" : "Terms & Conditions",
      gdpr: language === "ro" ? "Politica de confidențialitate" : "Privacy Policy"
    }
  }, [language, forceRefresh])

  return (
    <footer className="border-t mt-auto py-6 bg-white dark:bg-gray-950">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          {translations.copyright.replace("{year}", new Date().getFullYear().toString())}
        </p>
        <nav className="flex gap-4">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
          >
            {translations.terms}
          </Link>
          <Link
            href="/gdpr"
            className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
          >
            {translations.gdpr}
          </Link>
        </nav>
      </div>
    </footer>
  )
} 