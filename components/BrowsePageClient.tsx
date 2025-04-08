"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface TabData {
  id: string
  label: string
  description: string
}

interface Project {
  id: string
  title: string
  description: string
  type: string
  createdAt: string
  authorName: string
  authorAvatar: string | null
  user: {
    firstName: string
    lastName: string
    university: string | null
    faculty: string | null
    avatar: string | null
  }
}

interface BrowsePageClientProps {
  tabsData: TabData[]
  initialTab: string
  projects: Project[]
}

export default function BrowsePageClient({
  tabsData,
  initialTab,
  projects,
}: BrowsePageClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "proiect")
  const router = useRouter()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/browse?tab=${value}`)
  }

  const handleCreateNew = () => {
    router.push("/projects/new")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Browse Projects</h1>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          {tabsData.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsData.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter((project) => project.type === tab.id)
                .map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{project.title}</CardTitle>
                      <CardDescription>
                        By {project.authorName} • {new Date(project.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3">{project.description}</p>
                      <Button
                        variant="link"
                        className="mt-4 p-0"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

