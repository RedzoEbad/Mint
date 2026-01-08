"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect to appropriate dashboard based on role
        const dashboardRoutes: Record<string, string> = {
          super_admin: "/dashboard/admin",
          admin: "/dashboard/admin",
          receptionist: "/dashboard/candidates",
          process_agent: "/dashboard/agent",
          accountant: "/dashboard/accounts",
        }
        const targetRoute = dashboardRoutes[user.role] ?? "/dashboard"
        router.push(targetRoute)
      } else {
        // Redirect to login if not authenticated
        router.push("/login")
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
