import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "../components/Navbar"
import RootLayout from "@/components/RootLayout"
import { LanguageProvider } from "@/components/LanguageToggle";
import "./globals.css"
import Footer from "@/components/Footer"
import { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "VOC - Vocea Campusului",
    template: "%s | VOC - Vocea Campusului"
  },
  description: "Vocea Campusului - Platforma educațională colaborativă pentru studenți. Partajează și descoperă resurse academice, proiecte și materiale de studiu.",
  keywords: ["educație", "studenți", "universitate", "resurse academice", "proiecte", "colaborare"],
  authors: [{ name: "Vocea Campusului" }],
  creator: "Vocea Campusului",
  publisher: "Vocea Campusului",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    alternateLocale: "en_US",
    title: "VOC - Vocea Campusului",
    description: "Vocea Campusului - Platforma educațională colaborativă pentru studenți. Partajează și descoperă resurse academice, proiecte și materiale de studiu.",
    siteName: "Vocea Campusului",
    images: [{
      url: "/logo-vocea.png",
      width: 150,
      height: 150,
      alt: "Vocea Campusului Logo"
    }]
  },
  twitter: {
    card: "summary",
    title: "VOC - Vocea Campusului",
    description: "Vocea Campusului - Platforma educațională colaborativă pentru studenți. Partajează și descoperă resurse academice, proiecte și materiale de studiu.",
    images: ["/logo-vocea.png"],
  },
  icons: {
    icon: "/logo-vocea.png",
    shortcut: "/logo-vocea.png",
    apple: "/logo-vocea.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "verification_token",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider 
      appearance={{
        baseTheme: undefined
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} min-h-screen bg-background antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <LanguageProvider>
            <div className="flex min-h-screen flex-col">
              <div className="flex-1 flex flex-col md:flex-row">
                <Navbar />
                <main className="flex-1 md:ml-[calc(2rem+16rem)] mx-4 md:mr-8 mt-6 mb-6 bg-card rounded-3xl shadow-lg overflow-auto p-4 md:p-6 pt-16 md:pt-6">
                  <RootLayout>{children}</RootLayout>
                </main>
              </div>
              <Footer />
            </div>
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
