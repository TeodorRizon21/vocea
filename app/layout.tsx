import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "../components/Navbar"
import RootLayout from "@/components/RootLayout"
import "./globals.css"
import Footer from "@/components/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "VOC - Vocea campusului",
  description: "A platform for students to collaborate on projects and share resources.",
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} min-h-screen bg-background antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex min-h-screen flex-col">
              <div className="flex-1 flex">
                <Navbar />
                <main className="flex-1 ml-[calc(2rem+16rem)] mr-8 mt-6 mb-6 bg-card rounded-3xl shadow-lg overflow-auto p-6">
                  <RootLayout>{children}</RootLayout>
                </main>
              </div>
              <Footer />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

