import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Webhook } from "svix"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing required Svix headers" },
      { status: 400 }
    )
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
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    )
  }

  const eventType = evt.type

  try {
    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name } = evt.data
      const email = email_addresses[0].email_address

      await prisma.user.create({
        data: {
          clerkId: id,
          email,
          firstName: first_name,
          lastName: last_name,
          isOnboarded: false,
        },
      })
    }

    if (eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name } = evt.data
      const email = email_addresses[0].email_address

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
            firstName: first_name,
            lastName: last_name,
          },
        })
      } else {
        // Create user if they don't exist
        await prisma.user.create({
          data: {
            clerkId: id,
            email,
            firstName: first_name,
            lastName: last_name,
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

