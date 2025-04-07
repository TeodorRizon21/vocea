"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUploadThing } from "@/lib/uploadthing"
import { Loader2, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AvatarUploadProps {
  currentAvatar?: string | null
  firstName?: string
  lastName?: string
  onAvatarUploaded: (url: string) => Promise<void>
}

export default function AvatarUpload({ currentAvatar, firstName, lastName, onAvatarUploaded }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startUpload } = useUploadThing("avatar", {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        try {
          await onAvatarUploaded(res[0].url)
        } catch (error) {
          console.error("Error updating avatar:", error)
          setError("Failed to update avatar")
        }
      }
      setIsUploading(false)
    },
    onUploadError: (error) => {
      setError(error.message)
      setIsUploading(false)
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true)
      setError(null)
      await startUpload([e.target.files[0]])
    }
  }

  const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}` : "?"

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="w-24 h-24 border-2 border-purple-600">
        <AvatarImage src={currentAvatar || undefined} />
        <AvatarFallback className="bg-gray-200 text-gray-600 text-xl">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-center gap-2">
        <Button variant="outline" className="relative" disabled={isUploading}>
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept="image/*"
            disabled={isUploading}
          />
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Avatar
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

