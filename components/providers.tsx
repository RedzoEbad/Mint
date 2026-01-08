"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/components/auth-provider"
import { CompanyProvider } from "@/components/company-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CompanyProvider>
          {children}
        </CompanyProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
