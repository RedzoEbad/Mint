import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "accountant", "process_agent"])
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const paymentType = searchParams.get("payment_type") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (status) {
      paramCount++
      whereClause += ` AND p.payment_status = $${paramCount}`
      params.push(status)
    }

    if (paymentType) {
      paramCount++
      whereClause += ` AND p.payment_type = $${paramCount}`
      params.push(paymentType)
    }

    const paymentsResult = await query(
      `SELECT 
        p.*,
        c.full_name as candidate_name,
        c.passport_no,
        u.full_name as verified_by_name
      FROM payments p
      LEFT JOIN candidates c ON p.candidate_id = c.id
      LEFT JOIN users u ON p.verified_by = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset],
    )

    return NextResponse.json({
      success: true,
      data: paymentsResult.rows,
    })
  } catch (error) {
    console.error("Get payments error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent"])
    if (!auth.ok) return auth.response

    const { candidate_id, workflow_id, payment_type, amount, currency, payment_method, transaction_id, notes } =
      await request.json()

    const paymentResult = await query(
      `INSERT INTO payments (
        candidate_id, workflow_id, payment_type, amount, currency,
        payment_method, transaction_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [candidate_id, workflow_id, payment_type, amount, currency, payment_method, transaction_id, notes],
    )

    return NextResponse.json({
      success: true,
      message: "Payment record created successfully",
      paymentId: paymentResult.rows[0].id,
    })
  } catch (error) {
    console.error("Create payment error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
