import { getServerSession } from "next-auth/next"
import { NextRequest } from "next/server"
import { authOptions } from "./auth-config"

export async function getServerAuth() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getServerAuth()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden")
  }
  return session
}

export function getClientAuth() {
  if (typeof window === "undefined") {
    return null
  }
  
  // This will be used on the client side with useSession
  return null
}
