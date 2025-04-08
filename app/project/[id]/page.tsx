import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import ProjectDetailsWrapper from "@/components/ProjectDetailsWrapper"

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ProjectDetailsWrapper projectId={params.id} />
    </Suspense>
  )
}

