import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request, ["super_admin", "accountant"])
    if (!auth.ok) return auth.response

    const { status, notes } = await request.json()
    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 })
    }

    await query(
      `UPDATE expenses SET 
        status = $1,
        approved_by = CASE WHEN $1 = 'approved' THEN $2 ELSE approved_by END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [status, auth.payload.userId, params.id],
    )

    if (typeof notes === "string" && notes.trim().length > 0) {
      await query(`UPDATE expenses SET description = CONCAT(COALESCE(description, ''), '\n[Note] ', $1) WHERE id = $2`, [notes, params.id])
    }

    return NextResponse.json({ success: true, message: "Expense status updated" })
  } catch (error) {
    console.error("Update expense error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}