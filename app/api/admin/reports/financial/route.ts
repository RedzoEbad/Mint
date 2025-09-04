import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || "2024-01-01"
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0]

    // Get comprehensive financial data
    const [paymentSummary, expenseSummary, monthlyRevenue, paymentsByType] = await Promise.all([
      // Payment summary
      query(
        `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          AVG(CASE WHEN status = 'paid' THEN amount ELSE NULL END) as avg_transaction
        FROM payments
        WHERE created_at BETWEEN $1 AND $2
      `,
        [startDate, endDate],
      ),

      // Expense summary
      query(
        `
        SELECT 
          COUNT(*) as total_expenses,
          SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_expenses_amount,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_expenses
        FROM expenses
        WHERE created_at BETWEEN $1 AND $2
      `,
        [startDate, endDate],
      ),

      // Monthly revenue trend
      query(
        `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as revenue,
          COUNT(*) as transactions
        FROM payments
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `,
        [startDate, endDate],
      ),

      // Payments by type
      query(
        `
        SELECT 
          payment_type,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_amount
        FROM payments
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY payment_type
        ORDER BY total_amount DESC
      `,
        [startDate, endDate],
      ),
    ])

    return NextResponse.json({
      summary: {
        payments: paymentSummary.rows[0],
        expenses: expenseSummary.rows[0],
      },
      monthlyRevenue: monthlyRevenue.rows,
      paymentsByType: paymentsByType.rows,
      dateRange: { startDate, endDate },
    })
  } catch (error) {
    console.error("Financial report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
