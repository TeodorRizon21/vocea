import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, FolderPlus, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";

interface UserActivityProps {
  activity: {
    projectsCreated: number;
    projectsJoined: number;
    commentsPosted: number;
    forumTopicsCreated: number;
    recentComments: Array<{
      id: number;
      content: string;
      projectTitle: string;
      topicId: string;
    }>;
  };
  userPlan?: string;
}

export default function UserActivity({
  activity,
  userPlan = "Basic",
}: UserActivityProps) {
  const router = useRouter();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedCommentId, setSelectedCommentId] = useState("");

  const handleTopicClick = (
    e: React.MouseEvent,
    topicId: string,
    commentId?: string
  ) => {
    // Verifică dacă ID-ul este valid - dacă nu, nu face nimic
    if (!topicId || topicId === "unknown") {
      e.preventDefault();
      return;
    }

    // Creează URL-ul cu potențialul hash pentru comentariu
    const url = commentId
      ? `/forum/${topicId}#comment-${commentId}`
      : `/forum/${topicId}`;

    // Dacă utilizatorul are plan Basic, împiedică navigarea și arată dialogul
    if (userPlan === "Basic") {
      e.preventDefault();
      setSelectedTopicId(topicId);
      setSelectedCommentId(commentId || "");
      setShowAccessDenied(true);
      return;
    }

    // Pentru utilizatorii Premium sau Gold, permite navigarea normală
    e.preventDefault(); // Previne comportamentul implicit
    router.push(url);
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Your Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-6">
            <ActivityItem
              icon={FolderPlus}
              label="Projects Created"
              value={activity.projectsCreated}
            />
            <ActivityItem
              icon={MessageSquare}
              label="Comments Posted"
              value={activity.commentsPosted}
            />
            <ActivityItem
              icon={FileText}
              label="Forum Topics Created"
              value={activity.forumTopicsCreated}
            />
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-lg">Recent Comments</h4>
            {activity.recentComments.length > 0 ? (
              <ul className="space-y-3">
                {activity.recentComments.map((comment) => {
                  // Verificăm dacă topicId este valid
                  const isValidTopic =
                    comment.topicId &&
                    comment.topicId !== "unknown" &&
                    comment.topicId !== "";

                  return (
                    <li
                      key={comment.id}
                      className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                    >
                      {isValidTopic ? (
                        // Doar dacă topicId este valid, adăugăm funcționalitatea de click
                        <div
                          onClick={(e) =>
                            handleTopicClick(
                              e,
                              comment.topicId,
                              comment.id.toString()
                            )
                          }
                          className="block hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md p-2 -m-2 cursor-pointer"
                        >
                          <p className="font-medium text-sm text-purple-600 dark:text-purple-400 mb-1">
                            {comment.projectTitle}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {comment.content}
                          </p>
                        </div>
                      ) : (
                        // Dacă topicId nu este valid, doar afișăm conținutul fără funcționalitate de click
                        <div className="block rounded-md p-2 -m-2">
                          <p className="font-medium text-sm text-purple-600 dark:text-purple-400 mb-1">
                            {comment.projectTitle}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {comment.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 italic">
                            (Topic indisponibil)
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent comments
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath={
          selectedCommentId
            ? `/forum/${selectedTopicId}#comment-${selectedCommentId}`
            : `/forum/${selectedTopicId}`
        }
      />
    </>
  );
}

function ActivityItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center space-x-2">
      <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-full">
        <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
          {value}
        </p>
      </div>
    </div>
  );
}
