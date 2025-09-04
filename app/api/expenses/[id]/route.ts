import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !["super_admin", "accountant"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 })
    }

    const { status } = await request.json()

    await query(
      `UPDATE expenses SET
        status = $1,
        approved_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [status, payload.userId, params.id],
    )

    return NextResponse.json({
      success: true,
      message: "Expense status updated successfully",
    })
  } catch (error) {
    console.error("Update expense error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
