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
        console.log("Quota data received:", data)
        setQuotaData(data)
      } catch (error) {
        console.error("Error fetching quota:", error)
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
  console.log("Current quota values:", { remaining, limit })
  console.log("Limit type:", typeof limit)

  // Check if either value is infinite (could be number Infinity or string "Infinity")
  const isUnlimited = !Number.isFinite(limit) || !Number.isFinite(remaining)
  console.log("Is unlimited?", isUnlimited)

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {language === "ro" ? (
        <>
          <span className="font-medium">{quotaData.projectCount}</span> din{" "}
          <span className="font-medium">
            {limit === Infinity ? "∞" : limit}
          </span>{" "}
          proiecte active
        </>
      ) : (
        <>
          You've used <span className="font-medium">{quotaData.projectCount}</span> of{" "}
          <span className="font-medium">
            {limit === Infinity ? "∞" : limit}
          </span>{" "}
          active projects allowed this month
        </>
      )}
    </div>
  )
} 