import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { query } from "@/lib/database"
import bcrypt from "bcryptjs"
import { logger, getRequestContext } from "@/lib/logger"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = getRequestContext(request)
    const auth = await requireAuth(request, ["super_admin", "admin"])
    if (!auth.ok) return auth.response

    const { email, full_name, password, role, is_active } = await request.json()
    const userId = params.id

    // Enforce role immutability
    if (role) {
      return NextResponse.json({ success: false, message: "Role cannot be changed once assigned" }, { status: 400 })
    }

    // If actor is admin, apply stricter rules around roles and targets
    if (auth.payload.role === "admin") {
      // Prevent admin from editing super_admin accounts
      const target = await query("SELECT role FROM users WHERE id = $1", [userId])
      const targetRole = target.rows[0]?.role as string | undefined
      if (targetRole === "super_admin") {
        return NextResponse.json({ success: false, message: "Not allowed to edit super admin" }, { status: 403 })
      }
    }

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

    // role updates are intentionally disabled

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

    logger.info("Admin Users PUT updated", { ...ctx, actorId: auth.payload.userId, targetId: userId })
    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (error) {
    const ctx = getRequestContext(request)
    logger.error("Admin Users PUT error", { ...ctx, error: (error as any)?.message })
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = getRequestContext(request)
    const auth = await requireAuth(request, ["super_admin", "admin"])
    if (!auth.ok) return auth.response

    const userId = params.id

    // Prevent self-deletion
    if (auth.payload.userId === userId) {
      return NextResponse.json({ success: false, message: "Cannot delete your own account" }, { status: 400 })
    }

    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [userId])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    logger.info("Admin Users DELETE deleted", { ...ctx, actorId: auth.payload.userId, targetId: userId })
    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    const ctx = getRequestContext(request)
    logger.error("Admin Users DELETE error", { ...ctx, error: (error as any)?.message })
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
