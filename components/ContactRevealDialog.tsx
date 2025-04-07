"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface ContactRevealDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ContactRevealDialog({ isOpen, onClose, onConfirm }: ContactRevealDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Safety Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You are about to view contact information that has been provided by the project owner. Please be aware
              that:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>We do not verify contact information</li>
              <li>Be cautious of potential scams or fraudulent activities</li>
              <li>Never send money or sensitive personal information</li>
              <li>Meet in public places for any in-person meetings</li>
            </ul>
            <p className="font-semibold mt-4">
              Vocea Campusului is not responsible for any interactions that occur through this contact information.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>I Understand, Show Contact</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

