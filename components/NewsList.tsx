"use client"

import { useState, useEffect } from "react"
import NewsCarousel from "@/components/NewsCarousel"
import { Loader2 } from "lucide-react"

export default function NewsList() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/news")
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setNews(data)
      } catch (error) {
        console.error("Error fetching news:", error)
        setError("Failed to load news")
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
        {error}
      </div>
    )
  }

  return <NewsCarousel news={news} />
} 