"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Star } from "lucide-react"

interface ReviewFormProps {
  projectId: string
  onSubmit: (reviewData?: any) => void
}

export default function ReviewForm({ projectId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "You must select a rating between 1 and 5 stars",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          score: rating,
          comment,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit review")
      }

      const reviewData = await response.json()
      setRating(0)
      setComment("")
      onSubmit(reviewData)
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Failed to submit review",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Your Rating</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
              aria-label={`Rate ${star} stars out of 5`}
            >
              <Star
                className={`h-8 w-8 ${
                  (hoveredRating ? star <= hoveredRating : star <= rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                } transition-colors`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium mb-2">
          Comment (optional)
        </label>
        <Textarea
          id="comment"
          placeholder="Share your thoughts about this project..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </div>

      <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting || rating === 0}>
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}

