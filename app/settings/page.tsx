"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useLanguage } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      toast({
        variant: "destructive",
        title: language === "ro" ? "Eroare" : "Error",
        description: language === "ro" 
          ? "Vă rugăm să introduceți o adresă de email validă." 
          : "Please enter a valid email address.",
      });
      return;
    }

    // Check if the new email is the same as the current one
    if (newEmail === user?.emailAddresses[0]?.emailAddress) {
      toast({
        variant: "destructive",
        title: language === "ro" ? "Eroare" : "Error",
        description: language === "ro" 
          ? "Această adresă de email este deja adresa ta principală." 
          : "This email address is already your primary email.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First, create the new email address
      const emailAddress = await user?.createEmailAddress({ 
        email: newEmail
      });

      if (emailAddress) {
        // Then, prepare the verification
        await emailAddress.prepareVerification({
          strategy: "email_code"
        });

        toast({
          title: language === "ro" ? "Email actualizat" : "Email updated",
          description: language === "ro" 
            ? "Am trimis un email de verificare la noua adresă." 
            : "We've sent a verification email to the new address.",
        });
        setNewEmail("");
      }
    } catch (error: any) {
      let errorMessage = language === "ro" 
        ? "Nu s-a putut actualiza email-ul." 
        : "Could not update email.";
      
      if (error.errors?.[0]?.message) {
        if (error.errors[0].message.includes("already exists")) {
          errorMessage = language === "ro" 
            ? "Această adresă de email este deja folosită." 
            : "This email address is already in use.";
        } else if (error.errors[0].message.includes("invalid")) {
          errorMessage = language === "ro"
            ? "Adresa de email este invalidă."
            : "The email address is invalid.";
        }
      }

      toast({
        variant: "destructive",
        title: language === "ro" ? "Eroare" : "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast({
        variant: "destructive",
        title: language === "ro" ? "Eroare" : "Error",
        description: language === "ro" 
          ? "Vă rugăm să completați toate câmpurile." 
          : "Please fill in all fields.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update the password
      await user?.updatePassword({
        currentPassword,
        newPassword,
      });

      // Sign out the user to ensure they log in with the new password
      await signOut();

      toast({
        title: language === "ro" ? "Parolă actualizată" : "Password updated",
        description: language === "ro" 
          ? "Parola ta a fost actualizată cu succes. Te rugăm să te autentifici din nou." 
          : "Your password has been updated successfully. Please sign in again.",
      });
    } catch (error: any) {
      let errorMessage = language === "ro" 
        ? "Nu s-a putut actualiza parola." 
        : "Could not update password.";
      
      if (error.errors?.[0]?.message) {
        if (error.errors[0].message.includes("current password")) {
          errorMessage = language === "ro"
            ? "Parola actuală este incorectă."
            : "Current password is incorrect.";
        }
      }

      toast({
        variant: "destructive",
        title: language === "ro" ? "Eroare" : "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{language === "ro" ? "Informații cont" : "Account Information"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{language === "ro" ? "Nume" : "Name"}</Label>
            <p className="text-sm text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div>
            <Label>{language === "ro" ? "Email" : "Email"}</Label>
            <p className="text-sm text-muted-foreground">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          <div>
            <Label>{language === "ro" ? "Data înregistrării" : "Registration Date"}</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(user?.createdAt || "").toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{language === "ro" ? "Schimbă email" : "Change Email"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{language === "ro" ? "Email nou" : "New Email"}</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isLoading}
                placeholder={user?.emailAddresses[0]?.emailAddress}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (language === "ro" ? "Se actualizează..." : "Updating...") 
                : (language === "ro" ? "Actualizează email" : "Update Email")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{language === "ro" ? "Schimbă parola" : "Change Password"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {language === "ro" ? "Parola actuală" : "Current Password"}
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {language === "ro" ? "Parola nouă" : "New Password"}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (language === "ro" ? "Se actualizează..." : "Updating...") 
                : (language === "ro" ? "Actualizează parola" : "Update Password")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
