"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";

interface CreateTopicButtonProps {
  onClick: () => void;
  userPlan?: string;
}

export default function CreateTopicButton({
  onClick,
  userPlan = "Basic",
}: CreateTopicButtonProps) {
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const handleClick = () => {
    if (userPlan === "Basic") {
      setShowAccessDenied(true);
      return;
    }
    onClick();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className="bg-purple-600 hover:bg-purple-700"
      >
        <Plus className="mr-2 h-4 w-4" /> Create New Topic
      </Button>

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath="/forum/new"
      />
    </>
  );
}
