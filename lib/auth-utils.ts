import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

const secret = new TextEncoder().encode(JWT_SECRET)

export interface User {
  id: string
  email: string
  role: "super_admin" | "receptionist" | "process_agent" | "accountant"
  full_name: string
  phone?: string
  is_active: boolean
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

// Role-based access control
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

// Check if user is super admin
export function isSuperAdmin(userRole: string): boolean {
  return userRole === "super_admin"
}

// Get role permissions
export function getRolePermissions(role: string) {
  const permissions = {
    super_admin: {
      candidates: ["create", "read", "update", "delete", "export"],
      users: ["create", "read", "update", "delete"],
      companies: ["create", "read", "update", "delete"],
      payments: ["create", "read", "update", "delete", "approve"],
      workflows: ["create", "read", "update", "delete"],
      reports: ["read", "export"],
      expenses: ["create", "read", "update", "delete", "approve"],
      salaries: ["create", "read", "update", "delete"],
    },
    receptionist: {
      candidates: ["create", "read", "update", "delete"],
      companies: ["read"],
      workflows: ["read"],
      payments: ["read"],
      reports: [],
      expenses: [],
      salaries: [],
    },
    process_agent: {
      candidates: ["read", "update"],
      companies: ["read", "update"],
      workflows: ["create", "read", "update"],
      payments: ["read", "create"],
      interviews: ["create", "read", "update"],
      reports: ["read"],
      expenses: [],
      salaries: [],
    },
    accountant: {
      candidates: ["read"],
      companies: ["read"],
      workflows: ["read"],
      payments: ["read", "update", "approve"],
      expenses: ["create", "read", "update", "approve"],
      salaries: ["create", "read", "update"],
      reports: ["read"],
      users: [],
    },
  }

  return permissions[role as keyof typeof permissions] || {}
}
