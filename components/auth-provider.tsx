"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getValidToken, setValidToken, cleanupMalformedTokens } from "@/lib/token-utils"

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Clean up any malformed tokens first
    cleanupMalformedTokens()
    
    // Check for existing valid token on mount
    const token = getValidToken()
    if (token) {
      // Verify token with server
      fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
          }
          return res.json()
        })
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user)
          } else {
            console.warn("Token verification failed, clearing stored token")
            localStorage.removeItem("auth-token")
          }
        })
        .catch((error) => {
          console.warn("Token verification error:", error.message)
          localStorage.removeItem("auth-token")
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Keep token in localStorage for client-side fetches; httpOnly cookie is set by server
        if (setValidToken(data.token)) {
          setUser(data.user)
        } else {
          console.warn("Failed to store valid token")
          return false
        }

        // Redirect based on role
        const dashboardRoutes = {
          super_admin: "/dashboard/admin",
          admin: "/dashboard/users",
          receptionist: "/dashboard/receptionist",
          process_agent: "/dashboard/agent",
          accountant: "/dashboard/accounts",
        }

        router.push(dashboardRoutes[data.user.role as keyof typeof dashboardRoutes])
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    // Clear localStorage token
    localStorage.removeItem("auth-token")
    
    // Clear httpOnly cookie by calling logout API
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Fallback: try to clear cookie manually
      document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax"
    })
    
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
