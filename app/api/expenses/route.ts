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
    if (!payload || !["super_admin", "accountant"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const category = searchParams.get("category") || ""

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (status) {
      paramCount++
      whereClause += ` AND e.status = $${paramCount}`
      params.push(status)
    }

    if (category) {
      paramCount++
      whereClause += ` AND e.category = $${paramCount}`
      params.push(category)
    }

    const expensesResult = await query(
      `SELECT 
        e.*,
        u1.full_name as created_by_name,
        u2.full_name as approved_by_name
      FROM expenses e
      LEFT JOIN users u1 ON e.created_by = u1.id
      LEFT JOIN users u2 ON e.approved_by = u2.id
      ${whereClause}
      ORDER BY e.created_at DESC`,
      params,
    )

    return NextResponse.json({
      success: true,
      data: expensesResult.rows,
    })
  } catch (error) {
    console.error("Get expenses error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { category, description, amount, currency, expense_date, receipt_file } = await request.json()

    const expenseResult = await query(
      `INSERT INTO expenses (
        category, description, amount, currency, expense_date, receipt_file, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [category, description, amount, currency, expense_date, receipt_file, payload.userId],
    )

    return NextResponse.json({
      success: true,
      message: "Expense created successfully",
      expenseId: expenseResult.rows[0].id,
    })
  } catch (error) {
    console.error("Create expense error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
