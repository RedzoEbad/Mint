import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "accountant"])
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const countRes = await query(`SELECT COUNT(*) FROM salaries`)
    const result = await query(
      `SELECT s.*, u.full_name as user_name, p.full_name as processed_by_name
       FROM salaries s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN users p ON s.processed_by = p.id
       ORDER BY s.salary_month DESC, s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    const total = Number.parseInt(countRes.rows[0].count || '0')
    return NextResponse.json({ success: true, data: result.rows, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (e) {
    console.error("Get salaries error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "accountant"])
    if (!auth.ok) return auth.response

    const { user_id, basic_salary, allowances = 0, deductions = 0, salary_month } = await request.json()
    const net = Number(basic_salary) + Number(allowances) - Number(deductions)
    const res = await query(
      `INSERT INTO salaries (user_id, basic_salary, allowances, deductions, net_salary, salary_month, processed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [user_id, basic_salary, allowances, deductions, net, salary_month, auth.payload.userId]
    )
    return NextResponse.json({ success: true, salaryId: res.rows[0].id })
  } catch (e) {
    console.error("Create salary error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


