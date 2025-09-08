import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { query } from "@/lib/database"
import bcrypt from "bcryptjs"
import { withTiming, timedQuery } from "@/lib/performance"

// Dynamic route - can't use revalidate with request headers

export const GET = withTiming(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request, ["super_admin", "admin"])
    if (!auth.ok) return auth.response

    const result = await timedQuery(
      () => query(
      `SELECT id, email, role, full_name, phone, is_active, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`,
    ), "Admin Users List Query")

    return NextResponse.json({ success: true, users: result.rows })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}, "Admin Users GET")

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "admin"])
    if (!auth.ok) return auth.response

    const { email, full_name, password, role, is_active } = await request.json()

    if (!email || !full_name || !password || !role) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    // Prevent admin from creating super_admin
    if (auth.payload.role === "admin" && role === "super_admin") {
      return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 })
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [email])
    if (existing.rows.length > 0) {
      return NextResponse.json({ success: false, message: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const insert = await query(
      `INSERT INTO users (email, password_hash, role, full_name, is_active)
       VALUES ($1, $2, $3, $4, COALESCE($5, true))
       RETURNING id, email, role, full_name, is_active, created_at`,
      [email, hashedPassword, role, full_name, typeof is_active === "boolean" ? is_active : null],
    )

    return NextResponse.json({ success: true, user: insert.rows[0] }, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
