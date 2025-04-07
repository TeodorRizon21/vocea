"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Tab {
  id: string
  label: string
}

interface TabsSectionProps {
  tabs: Tab[]
  activeTab: string
  setActiveTab: (id: string) => void
}

export default function TabsSection({ tabs, activeTab, setActiveTab }: TabsSectionProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3 rounded-full">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-full"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

