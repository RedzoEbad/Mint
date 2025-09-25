import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { query } from "@/lib/database"

export async function GET(request: Request) {
  const auth = await requireAuth(request as any, ["super_admin", "admin", "accountant"]) as any
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") || "").trim()
  const res = await query(
    `SELECT e.*
     FROM employees e
     ${q ? `WHERE e.full_name ILIKE '%' || $1 || '%' OR e.email ILIKE '%' || $1 || '%'` : ``}
     ORDER BY e.full_name ASC
     LIMIT 100`,
    q ? [q] : [],
  )
  return NextResponse.json({ success: true, data: res.rows })
}

export async function POST(request: Request) {
  const auth = await requireAuth(request as any, ["super_admin", "admin"]) as any
  if (!auth.ok) return auth.response
  const { full_name, email, phone, department, position, join_date, status } = await request.json().catch(() => ({}))
  if (!full_name) return NextResponse.json({ success: false, message: "full_name required" }, { status: 400 })
  const res = await query(
    `INSERT INTO employees (full_name, email, phone, department, position, join_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active')) RETURNING *`,
    [full_name, email, phone, department, position, join_date, status],
  )
  return NextResponse.json({ success: true, data: res.rows[0] })
}

export async function PUT(request: Request) {
  const auth = await requireAuth(request as any, ["super_admin", "admin"]) as any
  if (!auth.ok) return auth.response
  const { id, full_name, email, phone, department, position, join_date, status } = await request.json().catch(() => ({}))
  if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 })
  await query(
    `UPDATE employees SET 
      full_name = COALESCE($2, full_name),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone),
      department = COALESCE($5, department),
      position = COALESCE($6, position),
      join_date = COALESCE($7, join_date),
      status = COALESCE($8, status),
      updated_at = now()
     WHERE id = $1`,
    [id, full_name, email, phone, department, position, join_date, status],
  )
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(request as any, ["super_admin", "admin"]) as any
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 })
  await query(`DELETE FROM employees WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}


