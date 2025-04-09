export interface User {
  id: string
  clerkId: string
  email: string
  name?: string
  university?: string
  faculty?: string // Added faculty field
  city?: string
  year?: string
  isOnboarded: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserActivity {
  projectsCreated: number
  projectsJoined: number
  commentsPosted: number
  forumTopicsCreated: number
  recentComments: Array<{
    id: number
    content: string
    projectTitle: string
  }>
}
