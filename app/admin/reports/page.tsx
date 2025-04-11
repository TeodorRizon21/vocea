"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Check, X, ExternalLink, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: {
    firstName: string | null;
    lastName: string | null;
    university: string | null;
    faculty: string | null;
  };
  project?: {
    id: string;
    title: string;
    type: string;
    university: string;
    faculty: string;
  };
  topic?: {
    id: string;
    title: string;
    university: string;
    faculty: string;
  };
  comment?: {
    id: string;
    content: string;
    topicId: string;
    topic: {
      title: string;
    };
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { user, isLoaded, isSignedIn } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPlan, setUserPlan] = useState("Basic");
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const checkAdmin = async () => {
        try {
          // Basic admin check
          // @ts-ignore
          const isAdminUser = user?.publicMetadata?.isAdmin === true;
          setIsAdmin(isAdminUser);

          // Fetch user plan
          const response = await fetch(`/api/user`);
          if (response.ok) {
            const userData = await response.json();
            setUserPlan(userData.planType || "Basic");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      };

      checkAdmin();
      fetchReports();
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/reports");

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);

        if (response.status === 403) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to view this page",
          });
          router.push("/dashboard");
          return;
        }

        setError(`Error ${response.status}: ${response.statusText}`);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to fetch reports: ${response.statusText}`,
        });
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.id === id ? { ...report, status } : report
          )
        );
        toast({
          title: "Status updated",
          description: `Report marked as ${status}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update report status",
        });
      }
    } catch (error) {
      console.error("Error updating report status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const handleDeleteContent = async (report: Report) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this content? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      let endpoint = "";
      const method = "DELETE";

      if (report.type === "project" && report.project) {
        endpoint = `/api/projects/${report.project.id}`;
      } else if (report.type === "forum_topic" && report.topic) {
        endpoint = `/api/forum/${report.topic.id}`;
      } else if (report.type === "forum_comment" && report.comment) {
        endpoint = `/api/forum/${report.comment.topicId}/comment/${report.comment.id}`;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid content type",
        });
        return;
      }

      const response = await fetch(endpoint, { method });

      if (response.ok) {
        await updateReportStatus(report.id, "resolved");
        toast({
          title: "Content deleted",
          description: "The reported content has been deleted",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete content",
        });
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const getContentLink = (report: Report) => {
    if (report.type === "project" && report.project) {
      return `/project/${report.project.id}`;
    } else if (report.type === "forum_topic" && report.topic) {
      return `/forum/${report.topic.id}`;
    } else if (report.type === "forum_comment" && report.comment) {
      return `/forum/${report.comment.topicId}#comment-${report.comment.id}`;
    }
    return "#";
  };

  const getContentTitle = (report: Report) => {
    if (report.type === "project" && report.project) {
      return report.project.title;
    } else if (report.type === "forum_topic" && report.topic) {
      return report.topic.title;
    } else if (report.type === "forum_comment" && report.comment) {
      return `Comment on: ${report.comment.topic.title}`;
    }
    return "Unknown content";
  };

  const handleViewContent = (report: Report) => {
    const contentLink = getContentLink(report);

    if (contentLink === "#") {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu se poate accesa această resursă.",
      });
      return;
    }

    if (contentLink.startsWith("/forum/") && userPlan === "Basic") {
      toast({
        variant: "destructive",
        title: "Acces restricționat",
        description:
          "Ai nevoie de un abonament premium pentru a accesa acest conținut.",
      });

      if (window.confirm("Dorești să vezi planurile premium disponibile?")) {
        router.push("/subscriptions");
      }
    } else {
      window.location.href = contentLink;
    }
  };

  const renderReportCard = (report: Report) => {
    const contentLink = getContentLink(report);
    const contentTitle = getContentTitle(report);
    const formattedDate = format(new Date(report.createdAt), "PPP 'at' HH:mm");
    const isForumContent = contentLink.startsWith("/forum/");

    return (
      <Card key={report.id} className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium text-lg">{contentTitle}</h3>
              <p className="text-sm text-muted-foreground">
                Reported on {formattedDate} by{" "}
                {report.reporter?.firstName || "Unknown"}{" "}
                {report.reporter?.lastName || "User"}
              </p>
              <Badge
                className={`mt-2 ${
                  report.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : report.status === "resolved"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewContent(report)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteContent(report)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
          <div className="border p-3 rounded-md bg-gray-50 dark:bg-gray-800 mb-4">
            <p className="font-medium text-sm">Reason for report:</p>
            <p className="text-sm">{report.reason}</p>
          </div>
          {report.status === "pending" && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateReportStatus(report.id, "resolved")}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark Resolved
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateReportStatus(report.id, "dismissed")}
              >
                <X className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error Loading Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
          {error}
        </p>
        <Button onClick={fetchReports}>Try Again</Button>
      </div>
    );
  }

  const pendingReports = reports.filter(
    (report) => report.status === "pending"
  );
  const resolvedReports = reports.filter(
    (report) => report.status === "resolved"
  );
  const dismissedReports = reports.filter(
    (report) => report.status === "dismissed"
  );

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-bold text-purple-600">Raportari</h1>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedReports.length})
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            Dismissed ({dismissedReports.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          {pendingReports.length > 0 ? (
            pendingReports.map(renderReportCard)
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No pending reports
            </p>
          )}
        </TabsContent>
        <TabsContent value="resolved" className="mt-4">
          {resolvedReports.length > 0 ? (
            resolvedReports.map(renderReportCard)
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No resolved reports
            </p>
          )}
        </TabsContent>
        <TabsContent value="dismissed" className="mt-4">
          {dismissedReports.length > 0 ? (
            dismissedReports.map(renderReportCard)
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No dismissed reports
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
