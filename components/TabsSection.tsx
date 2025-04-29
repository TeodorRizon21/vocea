"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

interface Tab {
  id: string
  label: string
}

interface TabsSectionProps {
  tabs: Tab[]
  activeTab: string
  setActiveTab: (id: string) => void
}

export default function TabsSection({
  tabs,
  activeTab,
  setActiveTab,
}: TabsSectionProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            className={`w-full sm:w-auto ${
              activeTab === tab.id
                ? "bg-purple-600 hover:bg-purple-700"
                : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

