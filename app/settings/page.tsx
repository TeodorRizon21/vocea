"use client";

import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@clerk/nextjs";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";


export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { language } = useLanguage();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {language === "ro" ? "Trebuie să fii autentificat" : "You need to be signed in"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              {language === "ro" 
                ? "Vă rugăm să vă autentificați pentru a accesa setările." 
                : "Please sign in to access settings."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background flex justify-center px-2 sm:px-4 lg:px-8 py-10">
      <div className="w-full max-w-4xl space-y-8">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[360px] sm:min-w-full">
            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
}
