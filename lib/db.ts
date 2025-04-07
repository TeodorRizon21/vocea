import { prisma } from "./prisma"
import type { User } from "@prisma/client"

export async function createUser(clerkId: string, email: string, name?: string): Promise<User> {
  return await prisma.user.create({
    data: {
      clerkId,
      email,
      name,
    },
  })
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: {
      clerkId,
    },
  })
}

export async function updateUser(clerkId: string, data: Partial<User>): Promise<User> {
  return await prisma.user.update({
    where: {
      clerkId,
    },
    data,
  })
}

export async function deleteUser(clerkId: string): Promise<User> {
  return await prisma.user.delete({
    where: {
      clerkId,
    },
  })
}

