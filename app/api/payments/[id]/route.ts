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

    const { payment_status, notes } = await request.json()

    await query(
      `UPDATE payments SET
        payment_status = $1,
        notes = COALESCE($2, notes),
        verified_by = $3,
        verification_date = CURRENT_TIMESTAMP,
        payment_date = CASE WHEN $1 = 'paid' THEN CURRENT_TIMESTAMP ELSE payment_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [payment_status, notes, payload.userId, params.id],
    )

    // Update corresponding workflow payment status
    const paymentResult = await query("SELECT payment_type, workflow_id FROM payments WHERE id = $1", [params.id])

    if (paymentResult.rows.length > 0) {
      const { payment_type, workflow_id } = paymentResult.rows[0]
      const statusField = `${payment_type}_payment_status`

      await query(`UPDATE workflow_stages SET ${statusField} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        payment_status,
        workflow_id,
      ])
    }

    return NextResponse.json({
      success: true,
      message: "Payment status updated successfully",
    })
  } catch (error) {
    console.error("Update payment error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
