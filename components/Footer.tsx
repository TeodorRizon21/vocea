"use client"

import Link from "next/link"
import { useLanguage } from "@/components/LanguageToggle"
import { useMemo } from "react"
import NTPLogo from 'ntp-logo-react'

export default function Footer() {
  const { language, forceRefresh } = useLanguage()

  const translations = useMemo(() => {
    return {
      copyright: language === "ro" ? "© {year} VOC. Toate drepturile rezervate." : "© {year} VOC. All rights reserved.",
      terms: language === "ro" ? "Termeni și Condiții" : "Terms & Conditions",
      gdpr: language === "ro" ? "Politica de confidențialitate" : "Privacy Policy",
      anpc: language === "ro" ? "ANPC" : "ANPC"
    }
  }, [language, forceRefresh])

  return (
    <footer className="border-t mt-auto py-6 bg-white dark:bg-gray-950 md:pl-60 ">
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center gap-2 md:gap-4 px-4">
        <nav className="flex flex-row gap-4 justify-center w-full">
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
          <Link
            href="https://legislatie.just.ro/Public/DetaliiDocument/257649?fs=e&s=cl"
            className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
          >
            {translations.anpc}
          </Link>
        </nav>

        <div className="mt-4 md:mt-0 flex justify-center w-full">
          <NTPLogo color="#ffffff" version="orizontal" secret="151074" />
        </div>

        <p className="text-center text-sm leading-loose text-muted-foreground w-full mt-2">
          {translations.copyright.replace(
            "{year}",
            new Date().getFullYear().toString()
          )}
        </p>
      </div>
    </footer>
  )
} 