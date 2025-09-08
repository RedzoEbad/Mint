import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"
import { saveFile } from "@/lib/uploads"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "accountant"])
    if (!auth.ok) return auth.response

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
    const auth = await requireAuth(request, ["super_admin", "accountant"])
    if (!auth.ok) return auth.response

    const contentType = request.headers.get("content-type") || ""
    let category: string = ""
    let description: string = ""
    let amount: number = 0
    let currency: string = ""
    let expense_date: string | null = null
    let receiptUrl: string | null = null

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      category = String(form.get("category") || "").trim()
      description = String(form.get("description") || "").trim()
      amount = Number(String(form.get("amount") || "0"))
      currency = String(form.get("currency") || "").trim()
      expense_date = String(form.get("expense_date") || "") || null

      const file = form.get("receipt_file")
      if (file instanceof File && file.size > 0) {
        receiptUrl = (await saveFile("expense-receipts", file)).url
      }
    } else {
      const body = await request.json()
      category = body.category
      description = body.description
      amount = body.amount
      currency = body.currency
      expense_date = body.expense_date
      receiptUrl = body.receipt_file || null
    }

    const expenseResult = await query(
      `INSERT INTO expenses (
        category, description, amount, currency, expense_date, receipt_file, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [category, description, amount, currency, expense_date, receiptUrl, auth.payload.userId],
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
