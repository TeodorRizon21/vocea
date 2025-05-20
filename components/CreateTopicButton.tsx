"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AccessDeniedDialog from "@/components/AccessDeniedDialog";
import { useLanguage } from "@/components/LanguageToggle";

interface CreateTopicButtonProps {
  onClick: () => void;
  userPlan?: string;
  disabled?: boolean;
}

export default function CreateTopicButton({
  onClick,
  userPlan = "Basic",
  disabled = false,
}: CreateTopicButtonProps) {
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const { language, forceRefresh } = useLanguage();

  const buttonText = useMemo(() => {
    return language === "ro" ? "Crează subiect nou" : "Create New Topic";
  }, [language, forceRefresh]);

  const handleClick = () => {
    if (userPlan === "Basic") {
      setShowAccessDenied(true);
      return;
    }
    onClick();
  };

  const isBasicPlan = userPlan === "Basic";

  return (
    <>
      <Button
        onClick={handleClick}
        className="bg-purple-600 hover:bg-purple-700"
        disabled={disabled || isBasicPlan}
      >
        <Plus className="mr-2 h-4 w-4" /> {buttonText}
      </Button>

      <AccessDeniedDialog
        isOpen={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
        originalPath="/forum/new"
      />
    </>
  );
}
