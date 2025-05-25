"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/LanguageToggle"

interface ProjectQuotaData {
  projectCount: number
  limit: number
  canCreateProject: boolean
  remaining: number
}

export function ProjectQuota() {
  const [quotaData, setQuotaData] = useState<ProjectQuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { language } = useLanguage()

  const translations = {
    ro: {
      remaining: "proiecte rămase",
      unlimited: "proiecte nelimitate",
      error: "Nu s-a putut încărca informația despre limita de proiecte"
    },
    en: {
      remaining: "projects remaining",
      unlimited: "unlimited projects",
      error: "Could not load project limit information"
    }
  }

  const t = translations[language as keyof typeof translations]

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch("/api/projects/check-limit")
        if (!response.ok) throw new Error("Failed to fetch quota")
        const data = await response.json()
        setQuotaData(data)
      } catch (error) {
        toast({
          title: t.error,
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuota()
  }, [t.error, toast])

  if (loading || !quotaData) {
    return null
  }

  const { remaining, limit } = quotaData

  return (
    <div className="text-sm text-gray-600 dark:text-gray-400">
      {limit === Infinity ? (
        <span>{t.unlimited}</span>
      ) : (
        <span>
          {remaining} {t.remaining}
        </span>
      )}
    </div>
  )
} 