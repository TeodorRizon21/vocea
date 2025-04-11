import { useState } from "react";
import { useRouter } from "next/navigation";
import TopicCard from "./TopicCard";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";

interface Topic {
  id: string;
  title: string;
  content: string;
  userId: string;
  university: string;
  faculty: string;
  universityName?: string;
  facultyName?: string;
  category: string;
  isClosed: boolean;
  createdAt: string;
  updatedAt: Date;
  user: {
    firstName: string | null;
    lastName: string | null;
    university: string | null;
    faculty: string | null;
    universityName?: string | null;
    facultyName?: string | null;
    avatar?: string | null;
  };
  comments: any[];
  isFavorited: boolean;
  isOwner: boolean;
  favorites: string[];
}

export interface TopicListProps {
  topics: Topic[];
  onFavoriteToggle: (topicId: string) => Promise<void>;
  onDelete: (topicId: string) => Promise<void>;
  userPlan?: string;
}

export default function TopicList({
  topics,
  onFavoriteToggle,
  onDelete,
  userPlan = "Basic",
}: TopicListProps) {
  const router = useRouter();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const handleTopicClick = (e: React.MouseEvent, topicId: string) => {
    if (userPlan === "Basic") {
      e.preventDefault();
      setSelectedTopicId(topicId);
      setShowAccessDenied(true);
      return;
    }

    // Pentru planurile premium, navigare către pagina de topic
    router.push(`/forum/${topicId}`);
  };

  return (
    <div className="space-y-4">
      {topics.map((topic) => {
        const uniqueCommenters = new Set(
          topic.comments.map((comment) => comment.userId)
        ).size;

        return (
          <div
            key={topic.id}
            onClick={(e) => handleTopicClick(e, topic.id)}
            className="cursor-pointer"
          >
            <TopicCard
              id={topic.id}
              title={topic.title}
              university={topic.university}
              faculty={topic.faculty}
              universityName={topic.universityName}
              facultyName={topic.facultyName}
              comments={topic.comments.length}
              commenters={uniqueCommenters}
              createdAt={new Date(topic.createdAt)}
              isFavorited={topic.isFavorited}
              isOwner={topic.isOwner}
              author={{
                id: topic.userId,
                firstName: topic.user.firstName,
                lastName: topic.user.lastName,
                university: topic.user.university,
                faculty: topic.user.faculty,
                universityName: topic.user.universityName,
                facultyName: topic.user.facultyName,
                avatar: topic.user.avatar,
              }}
              onFavoriteToggle={async (topicId) =>
                await onFavoriteToggle(topicId)
              }
              onDelete={async (topicId) => await onDelete(topicId)}
            />
          </div>
        );
      })}

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath={`/forum/${selectedTopicId}`}
      />
    </div>
  );
}
