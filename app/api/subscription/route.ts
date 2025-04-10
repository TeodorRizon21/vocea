import { getAuth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req)
    console.log("Auth userId in POST /api/subscription:", clerkId)
    
    if (!clerkId) {
      console.error("Unauthorized: No userId found in POST /api/subscription")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    console.log("Subscription data received:", data)

    // Validăm planul de abonament
    const allowedPlans = ["Basic", "Premium", "Gold"]
    if (!data.subscription || !allowedPlans.includes(data.subscription)) {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 })
    }

    // Verificăm dacă există deja un abonament pentru utilizator
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        userId: clerkId,
      },
    })

    let updatedSubscription

    if (existingSubscription) {
      // Actualizăm abonamentul existent
      updatedSubscription = await prisma.subscription.update({
        where: {
          userId: clerkId,
        },
        data: {
          plan: data.subscription,
          status: "active",
          updatedAt: new Date(),
        },
      })
    } else {
      // Creăm un abonament nou
      updatedSubscription = await prisma.subscription.create({
        data: {
          userId: clerkId,
          plan: data.subscription,
          status: "active",
          startDate: new Date(),
        },
      })
    }

    // Actualizăm sau creăm utilizatorul dacă este necesar (pentru a ne asigura că există)
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    })

    if (!existingUser) {
      await prisma.user.create({
        data: {
          clerkId,
          email: "",
        },
      })
    }

    console.log("Subscription updated/created successfully:", updatedSubscription)
    return NextResponse.json(updatedSubscription)
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req)
    console.log("Auth userId in GET /api/subscription:", clerkId)
    
    if (!clerkId) {
      console.error("Unauthorized: No userId found in GET /api/subscription")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Căutăm abonamentul utilizatorului
    const subscription = await prisma.subscription.findUnique({
      where: {
        userId: clerkId,
      },
    })

    if (!subscription) {
      // Returnăm planul default dacă nu există un abonament
      return NextResponse.json({ plan: "Basic" })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 