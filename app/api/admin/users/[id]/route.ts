import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    const user = await verifyToken(token)
    if (!user || !["super_admin", "admin"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { email, full_name, password, role, is_active } = await request.json()
    const userId = params.id

    // Build update query dynamically
    const updates = []
    const values = []
    let paramCount = 1

    if (email) {
      updates.push(`email = $${paramCount}`)
      values.push(email)
      paramCount++
    }

    if (full_name) {
      updates.push(`full_name = $${paramCount}`)
      values.push(full_name)
      paramCount++
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12)
      updates.push(`password_hash = $${paramCount}`)
      values.push(hashedPassword)
      paramCount++
    }

    if (role) {
      updates.push(`role = $${paramCount}`)
      values.push(role)
      paramCount++
    }

    if (typeof is_active === "boolean") {
      updates.push(`is_active = $${paramCount}`)
      values.push(is_active)
      paramCount++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(userId)
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, email, role, full_name, is_active, created_at, updated_at
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    const user = await verifyToken(token)
    if (!user || !["super_admin", "admin"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Prevent self-deletion
    if (user.userId === userId) {
      return NextResponse.json({ success: false, message: "Cannot delete your own account" }, { status: 400 })
    }

    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [userId])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
