"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { getDashboardPathForRole } from "@/lib/auth-redirect"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace(getDashboardPathForRole(user.role))
    } else if (!loading && !user) {
      // Redirect to login if not authenticated
      router.replace("/login")
    }
  }, [user, loading, router])

  // Show loading state while determining redirect
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // This should not render as we redirect above, but just in case
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
