"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Tab {
  id: string
  label: string
}

interface ForumTabsProps {
  tabs: Tab[]
  activeTab: string
  setActiveTab: (id: string) => void
}

export default function ForumTabs({ tabs, activeTab, setActiveTab }: ForumTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="rounded-full">
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

