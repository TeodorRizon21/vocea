import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Webhook } from "svix"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { sendAccountCreationEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  console.log('\n🔔 Clerk webhook received');
  console.log('📝 Request headers:', Object.fromEntries(req.headers.entries()));
  
  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('❌ Missing svix headers');
    return new NextResponse("Error occurred -- no svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  console.log('🔑 Webhook secret exists:', !!process.env.WEBHOOK_SECRET);
  const wh = new Webhook(process.env.WEBHOOK_SECRET || "")

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
    console.log('✅ Webhook signature verified');
  } catch (err) {
    console.error("❌ Error verifying webhook:", err)
    return new NextResponse("Error occurred", { status: 400 })
  }

  const eventType = evt.type
  console.log('📝 Event type:', eventType);
  console.log('📦 Event data:', JSON.stringify(evt.data, null, 2));

  try {
    if (eventType === "user.created") {
      console.log('👤 Processing user.created event');
      const { id, email_addresses, first_name, last_name } = evt.data
      const email = email_addresses[0].email_address
      const firstName = first_name || undefined
      const lastName = last_name || undefined

      console.log('📧 User details:', { email, firstName, lastName });

      // Create user in database
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email,
          firstName,
          lastName,
          isOnboarded: false,
        },
      })

      console.log('✅ User created in database:', user);

      // Send welcome email
      if (email) {
        console.log('📨 Sending account creation email to:', email);
        try {
          const emailResult = await sendAccountCreationEmail({
            name: firstName || 'User',
            email: email,
          });
          
          if (emailResult.success) {
            console.log('✅ Account creation email sent successfully');
          } else {
            console.error('❌ Failed to send account creation email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('❌ Error sending account creation email:', emailError);
        }
      } else {
        console.log('⚠️ Skipping account creation email - no email address available');
      }
    }

    if (eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name } = evt.data
      const email = email_addresses[0].email_address
      const firstName = first_name || undefined
      const lastName = last_name || undefined

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
            firstName,
            lastName,
          },
        })
      } else {
        // Create user if they don't exist
        await prisma.user.create({
          data: {
            clerkId: id,
            email,
            firstName,
            lastName,
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
