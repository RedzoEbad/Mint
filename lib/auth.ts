if (typeof window !== "undefined") {
  throw new Error("Auth functions with database access cannot be used in browser environment")
}

import bcrypt from "bcryptjs"
import { query } from "./database"
import { generateToken, type User, type JWTPayload } from "./auth-utils"

// Re-export client-safe types and functions
export {
  type User,
  type JWTPayload,
  generateToken,
  verifyToken,
  hasPermission,
  isSuperAdmin,
  getRolePermissions,
} from "./auth-utils"

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Authenticate user
export async function authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const result = await query(
      "SELECT id, email, password_hash, role, full_name, phone, is_active FROM users WHERE email = $1 AND is_active = true",
      [email],
    )

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return null
    }

    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const token = await generateToken(tokenPayload)

    // Remove password_hash from user object
    const { password_hash, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      token,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await query(
      "SELECT id, email, role, full_name, phone, is_active FROM users WHERE id = $1 AND is_active = true",
      [userId],
    )

    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}
