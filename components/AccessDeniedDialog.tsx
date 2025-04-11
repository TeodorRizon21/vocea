"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AccessDeniedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalPath: string;
}

export default function AccessDeniedDialog({
  isOpen,
  onClose,
  originalPath,
}: AccessDeniedDialogProps) {
  const router = useRouter();

  const handleViewPlans = () => {
    window.location.href = "/subscriptions";
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl shadow-xl border-purple-100 dark:border-purple-900">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-5xl" style={{ color: "#9333ea" }}>
              🚀
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-purple-600 flex items-center justify-center">
            <span>Conținut premium</span>
          </DialogTitle>
          <DialogDescription className="text-base mt-2 text-center">
            Această secțiune este disponibilă în planurile noastre premium.
            Descoperă toate funcționalitățile platformei prin upgrade!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 my-2">
          <p className="text-gray-700 dark:text-gray-300 text-center font-medium mb-2">
            Beneficiile planurilor premium:
          </p>
          <ul className="list-none space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-center">
              <span className="mr-2">🔍</span>
              <span>Acces la toate proiectele</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2">💬</span>
              <span>Participare nelimitată în forum</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2">📝</span>
              <span>Crearea de proiecte și topicuri noi</span>
            </li>
          </ul>
        </div>
        <DialogFooter className="flex sm:justify-between gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Mai târziu
          </Button>
          <Button
            type="button"
            className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
            onClick={handleViewPlans}
          >
            Vezi planurile disponibile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
