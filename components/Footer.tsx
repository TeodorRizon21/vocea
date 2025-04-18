"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t mt-auto py-6 bg-white dark:bg-gray-950">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          © {new Date().getFullYear()} VOC. All rights reserved.
        </p>
        <nav className="flex gap-4">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
          >
            Terms & Conditions
          </Link>
          <Link
            href="/gdpr"
            className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
          >
            GDPR Policy
          </Link>
        </nav>
      </div>
    </footer>
  )
} 