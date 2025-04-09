"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"

interface ReportButtonProps {
  contentType: "project" | "forum_topic" | "forum_comment" | "review"
  contentId: string
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export default function ReportButton({
  contentType,
  contentId,
  variant = "ghost",
  size = "sm",
  className,
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isSignedIn } = useUser()

  const handleReport = async () => {
    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report content",
        variant: "destructive",
      })
      setIsOpen(false)
      return
    }

    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for your report",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: contentType,
          contentId,
          reason,
        }),
      })

      if (response.ok) {
        toast({
          title: "Report submitted",
          description: "Thank you for your report. Our team will review it shortly.",
          variant: "default",
        })
        setIsOpen(false)
        setReason("")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to submit report",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
        aria-label="Report content"
      >
        <Flag className="h-4 w-4 mr-2" />
        Report
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this content. Our team will review your report.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you're reporting this content..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={isSubmitting || !reason.trim()}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

