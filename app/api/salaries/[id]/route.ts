import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request, ["super_admin", "accountant"])
    if (!auth.ok) return auth.response

    const { payment_status } = await request.json()
    if (!payment_status || !["pending", "paid", "cancelled"].includes(payment_status)) {
      return NextResponse.json({ success: false, message: "Invalid payment status" }, { status: 400 })
    }

    await query(
      `UPDATE salaries SET 
        payment_status = $1,
        payment_date = CASE WHEN $1 = 'paid' THEN CURRENT_TIMESTAMP ELSE payment_date END,
        processed_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [payment_status, auth.payload.userId, params.id]
    )

    return NextResponse.json({ success: true, message: "Salary payment status updated" })
  } catch (e) {
    console.error("Update salary error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


