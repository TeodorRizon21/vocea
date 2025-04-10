import UserProfile from "@/components/UserProfile"
import BrowsePageWrapper from "@/components/BrowsePageWrapper"

export default function BrowsePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const activeTab = (searchParams.tab as string) || "proiect"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">Browse projects</h1>
        <UserProfile membershipPlan="Basic" />
      </div>

      <BrowsePageWrapper initialTab={activeTab} />
    </div>
  )
}
