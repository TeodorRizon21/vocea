"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import { Loader2, Reply, Star, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import UserTooltip from "@/components/UserTooltip"
import ReportButton from "@/components/ReportButton"

interface Comment {
  id: string
  content: string
  createdAt: string
  userId: string
  user: {
    firstName: string | null
    lastName: string | null
    university: string | null
    faculty: string | null
  }
  replies: Comment[]
  parentId?: string | null
}

interface Topic {
  id: string
  title: string
  content: string
  createdAt: string
  university: string
  faculty: string
  userId: string
  user: {
    firstName: string | null
    lastName: string | null
    university: string | null
    faculty: string | null
    avatar: string | null
  }
  comments: Comment[]
  isFavorited: boolean
  isOwner: boolean
}

interface CommentRepliesProps {
  replies: Comment[]
  topicOwnerId: string
  onDeleteReply: (replyId: string) => Promise<void>
  isAdmin: boolean
}

function CommentReplies({ replies, topicOwnerId, onDeleteReply, isAdmin }: CommentRepliesProps) {
  const { user } = useUser()
  const [visibleReplies, setVisibleReplies] = useState(2)
  const hasMoreReplies = replies.length > visibleReplies
  const showingAllReplies = visibleReplies >= replies.length

  const loadMoreReplies = () => {
    setVisibleReplies((prev) => Math.min(prev + 3, replies.length))
  }

  const showLessReplies = () => {
    setVisibleReplies(2)
  }

  return (
    <div className="space-y-4">
      {replies.slice(0, visibleReplies).map((reply) => (
        <Card key={reply.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <UserTooltip
                userId={reply.userId}
                firstName={reply.user.firstName}
                lastName={reply.user.lastName}
                university={reply.user.university}
                faculty={reply.user.faculty}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>
                      {reply.user.firstName?.[0]}
                      {reply.user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium hover:underline">
                      {reply.user.firstName} {reply.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reply.user.university}, {reply.user.faculty}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(reply.createdAt), "PPP 'at' HH:mm")}
                    </p>
                  </div>
                </div>
              </UserTooltip>
              <div className="flex space-x-2">
                <ReportButton contentType="forum_comment" contentId={reply.id} />
                {(user?.id === reply.userId || user?.id === topicOwnerId || isAdmin) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteReply(reply.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <p>{reply.content}</p>
          </CardContent>
        </Card>
      ))}

      {replies.length > 2 && (
        <Button variant="ghost" className="w-full" onClick={showingAllReplies ? showLessReplies : loadMoreReplies}>
          {showingAllReplies ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Show {Math.min(3, replies.length - visibleReplies)} More{" "}
              {replies.length - visibleReplies === 1 ? "Reply" : "Replies"}
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default function TopicPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchTopic()

    if (user) {
      // Check for admin role in public metadata
      const publicMetadata = user.publicMetadata
      setIsAdmin(publicMetadata.isAdmin === true)
    }
  }, [user])

  const fetchTopic = async () => {
    try {
      const response = await fetch(`/api/forum/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTopic(data)
      } else {
        router.push("/forum")
      }
    } catch (error) {
      console.error("Error fetching topic:", error)
      router.push("/forum")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/forum/${params.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        setNewComment("")
        await fetchTopic()
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/forum/${params.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          parentId: commentId,
        }),
      })

      if (response.ok) {
        setReplyContent("")
        setReplyTo(null)
        await fetchTopic()
      }
    } catch (error) {
      console.error("Error posting reply:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFavoriteToggle = async () => {
    if (!topic) return

    try {
      const response = await fetch(`/api/forum/${params.id}/favorite`, {
        method: "POST",
      })

      if (response.ok) {
        const { isFavorited } = await response.json()
        setTopic((prev) => (prev ? { ...prev, isFavorited } : null))
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const handleDeleteTopic = async () => {
    if (!topic || !window.confirm("Are you sure you want to delete this topic?")) return

    try {
      const response = await fetch(`/api/forum/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/forum")
      }
    } catch (error) {
      console.error("Error deleting topic:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/forum/${params.id}/comment/${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchTopic()
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!topic) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          Back to Forum
        </Button>
        <div className="flex gap-2">
          <ReportButton contentType="forum_topic" contentId={topic.id} />
          <Button
            variant="ghost"
            size="icon"
            className={`${topic.isFavorited ? "text-yellow-500" : "text-gray-400"} hover:text-yellow-500`}
            onClick={handleFavoriteToggle}
          >
            <Star className="h-5 w-5 fill-current" />
          </Button>
          {(topic.isOwner || isAdmin) && (
            <Button variant="ghost" size="icon" onClick={handleDeleteTopic} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{topic.title}</CardTitle>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{format(new Date(topic.createdAt), "PPP 'at' HH:mm")}</span>
            <span>•</span>
            <span>{topic.university}</span>
            <span>•</span>
            <span>{topic.faculty}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <UserTooltip
              userId={topic.userId}
              firstName={topic.user.firstName}
              lastName={topic.user.lastName}
              university={topic.user.university}
              faculty={topic.user.faculty}
              avatar={topic.user.avatar}
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {topic.user.firstName?.[0]}
                    {topic.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium hover:underline">
                    {topic.user.firstName} {topic.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {topic.user.university}, {topic.user.faculty}
                  </p>
                </div>
              </div>
            </UserTooltip>
          </div>
          <p className="whitespace-pre-line">{topic.content}</p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Comments ({topic.comments.length})</h2>

        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[100px]"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Post Comment
          </Button>
        </form>

        <div className="space-y-6">
          {topic.comments
            .filter((comment) => !comment.parentId)
            .map((comment) => (
              <div key={comment.id} className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <UserTooltip
                        userId={comment.userId}
                        firstName={comment.user.firstName}
                        lastName={comment.user.lastName}
                        university={comment.user.university}
                        faculty={comment.user.faculty}
                      >
                        <div className="flex items-center space-x-4 mb-4">
                          <Avatar>
                            <AvatarFallback>
                              {comment.user.firstName?.[0]}
                              {comment.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium hover:underline">
                              {comment.user.firstName} {comment.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {comment.user.university}, {comment.user.faculty}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(comment.createdAt), "PPP 'at' HH:mm")}
                            </p>
                          </div>
                        </div>
                      </UserTooltip>
                      <div className="flex space-x-2">
                        <ReportButton contentType="forum_comment" contentId={comment.id} />
                        {(user?.id === comment.userId || topic.isOwner || isAdmin) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="mb-4">{comment.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </CardContent>
                </Card>

                {replyTo === comment.id && (
                  <div className="ml-12 space-y-4">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                    />
                    <div className="space-x-2">
                      <Button onClick={() => handleSubmitReply(comment.id)} disabled={isSubmitting} size="sm">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Post Reply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyTo(null)
                          setReplyContent("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {comment.replies?.length > 0 && (
                  <div className="ml-12">
                    <CommentReplies
                      replies={comment.replies}
                      topicOwnerId={topic.userId}
                      onDeleteReply={handleDeleteComment}
                      isAdmin={isAdmin}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
