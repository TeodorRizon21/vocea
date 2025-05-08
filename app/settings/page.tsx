"use client";

import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@clerk/nextjs";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

function SetPasswordForm() {
  const { user } = useUser();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user || user.passwordEnabled) return null;

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      await user.updatePassword({ newPassword });
      toast({ title: "Password set!", description: "You can now sign in with your password." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.errors?.[0]?.message || "Failed to set password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSetPassword} className="space-y-4 bg-white border border-gray-200 rounded-lg p-6 mt-8 w-full">
      <h2 className="text-lg font-semibold">Set a password for your account</h2>
      <div>
        <label className="block mb-1 font-medium">New Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Confirm Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full"
        disabled={loading}
      >
        {loading ? "Setting..." : "Set Password"}
      </button>
    </form>
  );
}

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
        <SetPasswordForm />
        <div className="w-full overflow-x-auto">
          <div className="min-w-[360px] sm:min-w-full">
            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
}
