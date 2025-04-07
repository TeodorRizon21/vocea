import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Webhook } from "svix"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occurred -- no svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(process.env.WEBHOOK_SECRET || "")

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new NextResponse("Error occurred", { status: 400 })
  }

  const eventType = evt.type

  try {
    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name } = evt.data
      const email = email_addresses[0].email_address
      const name = first_name && last_name ? `${first_name} ${last_name}` : undefined

      await prisma.user.create({
        data: {
          clerkId: id,
          email,
          name,
          isOnboarded: false,
        },
      })
    }

    if (eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name } = evt.data
      const email = email_addresses[0].email_address
      const name = first_name && last_name ? `${first_name} ${last_name}` : undefined

      // Check if user exists first
      const user = await prisma.user.findUnique({
        where: {
          clerkId: id,
        },
      })

      if (user) {
        await prisma.user.update({
          where: {
            clerkId: id,
          },
          data: {
            email,
            name,
          },
        })
      } else {
        // Create user if they don't exist
        await prisma.user.create({
          data: {
            clerkId: id,
            email,
            name,
            isOnboarded: false,
          },
        })
      }
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data
      await prisma.user.delete({
        where: {
          clerkId: id,
        },
      })
    }

    return new NextResponse("", { status: 200 })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

