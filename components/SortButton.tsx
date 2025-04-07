"use client"

import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

interface SortButtonProps {
  onSort: () => void
}

export default function SortButton({ onSort }: SortButtonProps) {
  return (
    <Button onClick={onSort} variant="outline" className="flex items-center">
      <ArrowUpDown className="mr-2 h-4 w-4" />
      Sort
    </Button>
  )
}

