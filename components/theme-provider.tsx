"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: string
  enableSystem?: boolean
  attribute?: string
  storageKey?: string
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
