"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import AvatarUpload from "@/components/AvatarUpload"
import { Separator } from "@/components/ui/separator"
import { Shield, User, Bell, Eye, EyeOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  // Form states
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [projectUpdates, setProjectUpdates] = useState(true)
  const [forumReplies, setForumReplies] = useState(true)

  // Avatar state
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setEmail(user.primaryEmailAddress?.emailAddress || "")
      setAvatar(user.imageUrl || null)
    }
  }, [user])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match."
      })
      return
    }

    setIsLoading(true)

    try {
      // Add actual password reset logic here using Clerk
      await user?.updatePassword({
        currentPassword,
        newPassword,
      })

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update password",
        description: "Please check your current password and try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Add actual email change logic here using Clerk
      await user?.createEmailAddress({
        email: email,
      })

      toast({
        title: "Email updated",
        description: "Your email has been updated successfully."
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update email",
        description: "Please try again later."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUploaded = async (url: string) => {
    try {
      // First update the avatar in your database
      const response = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: url }),
      })

      if (!response.ok) {
        throw new Error("Failed to update avatar")
      }

      // Then update the avatar in Clerk
      await user?.setProfileImage({
        file: await (await fetch(url)).blob(),
      })

      setAvatar(url)

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully."
      })

      return Promise.resolve()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update avatar",
        description: "Please try again later."
      })

      return Promise.reject(error)
    }
  }

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
      })

      if (!response.ok) {
        throw new Error("Failed to update notifications")
      }

      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved."
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update notifications",
        description: "Please try again later."
      })
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

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
  }

  return (
    <motion.div className="container max-w-6xl py-10 space-y-8" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </motion.div>

      <Tabs defaultValue="profile" className="w-full">
        <motion.div variants={item}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="profile">
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Update your profile picture</CardDescription>
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
                  <CardTitle>Email Address</CardTitle>
                  <CardDescription>Update your email address</CardDescription>
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
                      />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Updating..." : "Update Email"}
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
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
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
                    <Label htmlFor="newPassword">New Password</Label>
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
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                    {isLoading ? "Updating..." : "Change Password"}
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
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications about important updates</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={(checked: boolean) => {
                      setEmailNotifications(checked)
                      handleNotificationChange()
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="project-updates">Project Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when projects you're part of are updated
                    </p>
                  </div>
                  <Switch
                    id="project-updates"
                    checked={projectUpdates}
                    onCheckedChange={(checked: boolean) => {
                      setProjectUpdates(checked)
                      handleNotificationChange()
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="forum-replies">Forum Replies</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when someone replies to your forum posts
                    </p>
                  </div>
                  <Switch
                    id="forum-replies"
                    checked={forumReplies}
                    onCheckedChange={(checked: boolean) => {
                      setForumReplies(checked)
                      handleNotificationChange()
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">You can change these settings at any time</p>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

