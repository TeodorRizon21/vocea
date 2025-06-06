export type ProjectType = "proiect" | "cerere" | "diverse"

export interface Project {
  id: string
  type: ProjectType
  title: string
  description: string
  subject: string
  category: string
  university: string
  faculty: string
  phoneNumber: string
  images?: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface CreateProjectInput {
  type: ProjectType
  title: string
  description: string
  subject: string
  category: string
  university: string
  faculty: string
  phoneNumber: string
  images?: string[]
}

