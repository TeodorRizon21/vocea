"use client"

import { useState } from "react"
import { X, Loader2, AlertCircle, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useUploadThing } from "@/lib/uploadthing"
import { useDropzone } from "react-dropzone"
import type { FileWithPath } from "react-dropzone"

interface ProjectImageUploadProps {
  onImagesUploaded: (urls: string[]) => void
  existingImages?: string[]
  maxImages?: number
}

export default function ProjectImageUpload({
  onImagesUploaded,
  existingImages = [],
  maxImages = 4,
}: ProjectImageUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [images, setImages] = useState<string[]>(existingImages)

  const { startUpload, permittedFileInfo } = useUploadThing("projectImage", {
    onUploadBegin: () => {
      setIsUploading(true)
      setUploadError(null)
    },
    onClientUploadComplete: (res) => {
      const urls = res.map((file) => file.url)
      const newImages = [...images, ...urls]
      setImages(newImages)
      onImagesUploaded(newImages)
      setIsUploading(false)
    },
    onUploadError: (error) => {
      console.error("Upload error:", error)
      setUploadError(error.message || "Failed to upload image. Please try again.")
      setIsUploading(false)
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: maxImages - images.length,
    disabled: isUploading || images.length >= maxImages,
    onDrop: async (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles.length === 0) return

      try {
        await startUpload(acceptedFiles)
      } catch (err) {
        console.error("Error starting upload:", err)
        setUploadError("Failed to start upload. Please try again.")
      }
    },
  })

  const removeImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove)
    setImages(newImages)
    onImagesUploaded(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {images.map((url, index) => (
          <div key={url} className="relative group">
            <Image
              src={url || "/placeholder.svg"}
              alt={`Project image ${index + 1}`}
              width={200}
              height={200}
              className="rounded-lg object-cover w-full h-40"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {isUploading && (
        <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Uploading...</span>
        </div>
      )}

      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
            ${isUploading ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? "Drop your images here" : "Drag & drop images here, or click to select files"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Supports: PNG, JPG, GIF, WebP up to 4MB</p>
          <p className="text-xs text-muted-foreground mt-1">{maxImages - images.length} image(s) remaining</p>
        </div>
      )}

      {images.length >= maxImages && (
        <Alert>
          <AlertDescription>
            Maximum number of images ({maxImages}) reached. Remove an image to upload a new one.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

