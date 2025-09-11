import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

const secret = new TextEncoder().encode(JWT_SECRET)

export interface User {
  id: string
  email: string
  role: "super_admin" | "admin" | "receptionist" | "process_agent" | "accountant"
  full_name: string
  phone?: string
  is_active: boolean
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  full_name?: string
  phone?: string
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
    // Validate token format before attempting verification
    if (!token || typeof token !== 'string') {
      console.warn("Invalid token: token is empty or not a string")
      return null
    }

    // Check if token has the correct JWT format (3 parts separated by dots)
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      console.warn("Invalid token format: JWT must have 3 parts separated by dots")
      return null
    }

    // Check if token parts are not empty
    if (tokenParts.some(part => part.length === 0)) {
      console.warn("Invalid token format: JWT parts cannot be empty")
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    // Log specific error types for better debugging
    if (error instanceof Error) {
      if (error.message.includes('Invalid Compact JWS')) {
        console.warn("JWT verification failed: Invalid token format")
      } else if (error.message.includes('expired')) {
        console.warn("JWT verification failed: Token expired")
      } else if (error.message.includes('signature')) {
        console.warn("JWT verification failed: Invalid signature")
      } else {
        console.warn("JWT verification failed:", error.message)
      }
    } else {
      console.warn("JWT verification failed: Unknown error")
    }
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
    admin: {
      candidates: ["read"],
      users: ["create", "read", "update", "delete"],
      companies: ["read"],
      payments: ["read"],
      workflows: ["read"],
      reports: ["read"],
      expenses: [],
      salaries: [],
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
