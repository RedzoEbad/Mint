"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn, signOut, getSession } from "next-auth/react"
import { getDashboardPathForRole, waitForSession } from "@/lib/auth-redirect"

interface User {
  id: string
  email: string
  role: "super_admin" | "admin" | "receptionist" | "process_agent" | "accountant"
  full_name: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Clean up redundant localStorage auth-token
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-token")
    }

    if (status !== "loading") {
      setLoading(false)
    }
  }, [status])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        const session = await waitForSession(getSession)
        const target = getDashboardPathForRole(session?.user?.role)
        // Hard navigation ensures the session cookie is sent to middleware on Vercel
        if (typeof window !== "undefined") {
          window.location.assign(target)
        } else {
          router.replace(target)
        }
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const user = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role as "super_admin" | "admin" | "receptionist" | "process_agent" | "accountant",
    full_name: session.user.full_name,
    phone: session.user.phone
  } : null

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
