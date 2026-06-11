"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/components/auth-provider"
import { CompanyProvider } from "@/components/company-provider"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <CompanyProvider>
            {children}
          </CompanyProvider>
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
