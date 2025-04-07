"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CreateTopicButtonProps {
  onClick: () => void
}

export default function CreateTopicButton({ onClick }: CreateTopicButtonProps) {
  return (
    <Button onClick={onClick} className="bg-purple-600 hover:bg-purple-700">
      <Plus className="mr-2 h-4 w-4" /> Create New Topic
    </Button>
  )
}

