import { prisma } from "./prisma"
import type { User } from "@prisma/client"

export async function createUser(clerkId: string, email: string, name?: string): Promise<User> {
  // Split the name into firstName and lastName if provided
  let firstName: string | undefined = undefined
  let lastName: string | undefined = undefined
  
  if (name) {
    const nameParts = name.split(' ')
    firstName = nameParts[0]
    lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined
  }
  
  return await prisma.user.create({
    data: {
      clerkId,
      email,
      firstName,
      lastName,
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

