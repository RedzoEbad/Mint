import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request, ["super_admin", "accountant", "admin"])
    if (!auth.ok) return auth.response
    const { id } = await context.params
    const { payment_status, notes } = await request.json()

    await query(
      `UPDATE payments SET
        payment_status = $1::payment_status,
        notes = COALESCE($2, notes),
        verified_by = $3,
        verification_date = CURRENT_TIMESTAMP,
        payment_date = CASE WHEN $1::payment_status = 'paid'::payment_status THEN CURRENT_TIMESTAMP ELSE payment_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [payment_status, notes, auth.payload.userId, id],
    )

    // Update corresponding workflow payment status only when approved
    const paymentResult = await query("SELECT payment_type, workflow_id FROM payments WHERE id = $1", [id])

    if (paymentResult.rows.length > 0) {
      const { payment_type, workflow_id } = paymentResult.rows[0]
      const stage = String(payment_type || '').toLowerCase()
      const allowed = ['medical','visa','protector','passport','flight']
      if (allowed.includes(stage) && payment_status === 'paid') {
        const statusField = `${stage}_payment_status`
        await query(`UPDATE workflow_stages SET ${statusField} = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [
          workflow_id,
        ])
      }
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
