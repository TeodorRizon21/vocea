"use client"

import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FilterButtonProps {
  onFilter: () => void
  activeFiltersCount?: number
}

export default function FilterButton({ onFilter, activeFiltersCount = 0 }: FilterButtonProps) {
  return (
    <Button variant="outline" onClick={onFilter} className="relative">
      <Filter className="h-4 w-4 mr-2" />
      Filter
      {activeFiltersCount > 0 && (
        <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  )
}

