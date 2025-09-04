import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    const [pendingResult, todayResult, revenueResult, expensesResult] = await Promise.all([
      // Pending payments
      query("SELECT COUNT(*) as pending FROM payments WHERE payment_status = $1", ["pending"]),

      // Today's approved payments
      query(
        `SELECT COUNT(*) as today FROM payments WHERE payment_status = $1 AND DATE(verification_date) = CURRENT_DATE`,
        ["paid"],
      ),

      // Total revenue
      query(`SELECT COALESCE(SUM(amount), 0) as revenue FROM payments WHERE payment_status = $1`, ["paid"]),

      // Total expenses
      query(`SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses WHERE status = $1`, ["approved"]),
    ])

    const stats = {
      pending: Number.parseInt(pendingResult.rows[0].pending),
      today: Number.parseInt(todayResult.rows[0].today),
      revenue: Number.parseFloat(revenueResult.rows[0].revenue),
      expenses: Number.parseFloat(expensesResult.rows[0].expenses),
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Get payment stats error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
