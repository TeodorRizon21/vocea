"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import AvatarUpload from "@/components/AvatarUpload";
import { Separator } from "@/components/ui/separator";
import { Shield, User, Bell, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/LanguageToggle";

export default function SettingsPage() {
  const { user } = useUser();
  const { language, forceRefresh } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [forumReplies, setForumReplies] = useState(true);

  // Avatar state
  const [avatar, setAvatar] = useState<string | null>(null);

  // Traduceri pentru pagina de setări
  const translations = useMemo(() => {
    return {
      // Titluri și descrieri
      accountSettings: language === "ro" ? "Setări Cont" : "Account Settings",
      securitySettings:
        language === "ro" ? "Setări Securitate" : "Security Settings",
      notificationSettings:
        language === "ro" ? "Setări Notificări" : "Notification Settings",
      accountDescription:
        language === "ro"
          ? "Gestionează-ți informațiile personale și detaliile contului"
          : "Manage your personal information and account details",
      securityDescription:
        language === "ro"
          ? "Actualizează-ți parola și setările de securitate"
          : "Update your password and security settings",
      notificationDescription:
        language === "ro"
          ? "Controlează ce notificări primești din partea noastră"
          : "Control what notifications you receive from us",

      // Profile
      profileInformation:
        language === "ro" ? "Informații Profil" : "Profile Information",
      updateAvatar: language === "ro" ? "Actualizează Avatar" : "Update Avatar",
      emailAddress: language === "ro" ? "Adresă Email" : "Email Address",
      updateEmail: language === "ro" ? "Actualizează Email" : "Update Email",

      // Security
      changePassword: language === "ro" ? "Schimbă Parola" : "Change Password",
      currentPassword:
        language === "ro" ? "Parola Actuală" : "Current Password",
      newPassword: language === "ro" ? "Parola Nouă" : "New Password",
      confirmPassword:
        language === "ro" ? "Confirmă Parola" : "Confirm Password",
      showPassword: language === "ro" ? "Arată Parola" : "Show Password",
      hidePassword: language === "ro" ? "Ascunde Parola" : "Hide Password",
      updatePassword:
        language === "ro" ? "Actualizează Parola" : "Update Password",

      // Notifications
      emailNotifications:
        language === "ro" ? "Notificări Email" : "Email Notifications",
      projectUpdates:
        language === "ro" ? "Actualizări Proiecte" : "Project Updates",
      forumReplies: language === "ro" ? "Răspunsuri Forum" : "Forum Replies",
      emailNotificationsDescription:
        language === "ro"
          ? "Primește notificări importante prin email"
          : "Receive important notifications via email",
      projectUpdatesDescription:
        language === "ro"
          ? "Primește actualizări despre proiectele care te interesează"
          : "Receive updates about projects you're interested in",
      forumRepliesDescription:
        language === "ro"
          ? "Fii notificat când cineva răspunde la comentariile tale"
          : "Be notified when someone replies to your comments",
      saveChanges: language === "ro" ? "Salvează Modificările" : "Save Changes",

      // Toast messages
      passwordsDontMatch:
        language === "ro" ? "Parolele nu coincid" : "Passwords don't match",
      passwordsDontMatchDesc:
        language === "ro"
          ? "Te rugăm să te asiguri că parolele coincid."
          : "Please make sure your passwords match.",
      passwordUpdated:
        language === "ro" ? "Parolă actualizată" : "Password updated",
      passwordUpdatedDesc:
        language === "ro"
          ? "Parola ta a fost actualizată cu succes."
          : "Your password has been updated successfully.",
      failedToUpdatePassword:
        language === "ro"
          ? "Actualizarea parolei a eșuat"
          : "Failed to update password",
      checkCurrentPassword:
        language === "ro"
          ? "Te rugăm să verifici parola actuală și să încerci din nou."
          : "Please check your current password and try again.",
      emailUpdated: language === "ro" ? "Email actualizat" : "Email updated",
      emailUpdatedDesc:
        language === "ro"
          ? "Adresa ta de email a fost actualizată cu succes."
          : "Your email has been updated successfully.",
      failedToUpdateEmail:
        language === "ro"
          ? "Actualizarea email-ului a eșuat"
          : "Failed to update email",
      tryAgainLater:
        language === "ro"
          ? "Te rugăm să încerci din nou mai târziu."
          : "Please try again later.",
      avatarUpdated: language === "ro" ? "Avatar actualizat" : "Avatar updated",
      avatarUpdatedDesc:
        language === "ro"
          ? "Poza ta de profil a fost actualizată cu succes."
          : "Your profile picture has been updated successfully.",
      failedToUpdateAvatar:
        language === "ro"
          ? "Actualizarea avatarului a eșuat"
          : "Failed to update avatar",
      notificationSettingsUpdated:
        language === "ro"
          ? "Setări notificări actualizate"
          : "Notification settings updated",
      notificationPreferencesSaved:
        language === "ro"
          ? "Preferințele tale de notificare au fost salvate."
          : "Your notification preferences have been saved.",
      failedToUpdateNotifications:
        language === "ro"
          ? "Actualizarea setărilor de notificare a eșuat"
          : "Failed to update notifications",
    };
  }, [language, forceRefresh]);

  useEffect(() => {
    if (user) {
      setEmail(user.primaryEmailAddress?.emailAddress || "");
      setAvatar(user.imageUrl || null);
    }
  }, [user]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: translations.passwordsDontMatch,
        description: translations.passwordsDontMatchDesc,
      });
      return;
    }

    if (!currentPassword || !newPassword) {
      toast({
        variant: "destructive",
        title: language === "ro" ? "Câmpuri incomplete" : "Incomplete fields",
        description: language === "ro" ? "Te rugăm să completezi toate câmpurile." : "Please fill in all fields.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await user?.updatePassword({
        currentPassword,
        newPassword,
      });

      toast({
        title: translations.passwordUpdated,
        description: translations.passwordUpdatedDesc,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        variant: "destructive",
        title: translations.failedToUpdatePassword,
        description: translations.checkCurrentPassword,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: language === "ro" ? "Email invalid" : "Invalid email",
        description: language === "ro" ? "Te rugăm să introduci o adresă de email validă." : "Please enter a valid email address.",
      });
      return;
    }

    if (email === user?.primaryEmailAddress?.emailAddress) {
      toast({
        variant: "destructive",
        title: language === "ro" ? "Email neschimbat" : "Email unchanged",
        description: language === "ro" ? "Noua adresă de email este identică cu cea actuală." : "The new email address is the same as the current one.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await user?.createEmailAddress({ email });

      toast({
        title: language === "ro" ? "Email în așteptare" : "Email pending",
        description: language === "ro" 
          ? "Am trimis un email de verificare la noua adresă. Te rugăm să verifici căsuța de email și să confirmi schimbarea."
          : "We've sent a verification email to the new address. Please check your inbox and confirm the change.",
      });

    } catch (error: any) {
      console.error("Email update error:", error);
      
      let errorMessage = translations.tryAgainLater;
      
      // Handle specific Clerk error cases
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
        title: translations.failedToUpdateEmail,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUploaded = async (url: string) => {
    try {
      // First update the avatar in your database
      const response = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to update avatar");
      }

      // Then update the avatar in Clerk
      await user?.setProfileImage({
        file: await (await fetch(url)).blob(),
      });

      setAvatar(url);

      toast({
        title: translations.avatarUpdated,
        description: translations.avatarUpdatedDesc,
      });

      return Promise.resolve();
    } catch (error) {
      toast({
        variant: "destructive",
        title: translations.failedToUpdateAvatar,
        description: translations.tryAgainLater,
      });

      return Promise.reject(error);
    }
  };

  const handleNotificationChange = async () => {
    try {
      // Add actual notification settings update logic here
      const response = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailNotifications,
          projectUpdates,
          forumReplies,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notifications");
      }

      toast({
        title: translations.notificationSettingsUpdated,
        description: translations.notificationPreferencesSaved,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: translations.failedToUpdateNotifications,
        description: translations.tryAgainLater,
      });
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div
      className="container max-w-6xl py-10 space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400">
          {translations.accountSettings}
        </h1>
        <p className="text-muted-foreground mt-2">
          {translations.accountDescription}
        </p>
      </motion.div>

      <Tabs defaultValue="profile" className="w-full">
        <motion.div variants={item}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {translations.profileInformation}
              </span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">
                {translations.securitySettings}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">
                {translations.notificationSettings}
              </span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="profile">
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>{translations.profileInformation}</CardTitle>
                  <CardDescription>{translations.updateAvatar}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <AvatarUpload
                    currentAvatar={avatar}
                    firstName={user?.firstName || ""}
                    lastName={user?.lastName || ""}
                    onAvatarUploaded={handleAvatarUploaded}
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>{translations.emailAddress}</CardTitle>
                  <CardDescription>{translations.updateEmail}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEmailChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading 
                        ? (language === "ro" ? "Se actualizează..." : "Updating...") 
                        : translations.updateEmail}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle>{translations.securitySettings}</CardTitle>
                <CardDescription>
                  {translations.securityDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      {translations.currentPassword}
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      {translations.newPassword}
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {translations.confirmPassword}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : translations.updatePassword}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle>{translations.notificationSettings}</CardTitle>
                <CardDescription>
                  {translations.notificationDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">
                      {translations.emailNotifications}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {translations.emailNotificationsDescription}
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={(checked: boolean) => {
                      setEmailNotifications(checked);
                      handleNotificationChange();
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="project-updates">
                      {translations.projectUpdates}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {translations.projectUpdatesDescription}
                    </p>
                  </div>
                  <Switch
                    id="project-updates"
                    checked={projectUpdates}
                    onCheckedChange={(checked: boolean) => {
                      setProjectUpdates(checked);
                      handleNotificationChange();
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="forum-replies">
                      {translations.forumReplies}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {translations.forumRepliesDescription}
                    </p>
                  </div>
                  <Switch
                    id="forum-replies"
                    checked={forumReplies}
                    onCheckedChange={(checked: boolean) => {
                      setForumReplies(checked);
                      handleNotificationChange();
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleNotificationChange}>
                  {translations.saveChanges}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
