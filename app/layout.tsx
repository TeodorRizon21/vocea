import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "../components/Navbar"
import RootLayout from "@/components/RootLayout"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

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
            <div className="relative min-h-screen bg-background">
              <Navbar />
              <main className="fixed left-[calc(2rem+16rem+2rem)] right-[2rem] top-[1.5rem] bottom-[1.5rem] bg-card rounded-3xl shadow-lg overflow-auto p-6">
                <RootLayout>{children}</RootLayout>
              </main>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

