import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    // Broad read access for listing/choosing companies
    const auth = await requireAuth(request, ["super_admin", "process_agent", "admin", "accountant", "receptionist"])
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      whereClause += ` AND (name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount} OR requirements ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    const totalRes = await query(`SELECT COUNT(*) AS total FROM companies ${whereClause}`, params)

    const companiesResult = await query(
      `SELECT id, name, contact_person, email, phone, country
       FROM companies 
       ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: companiesResult.rows,
      meta: { total: Number.parseInt(totalRes.rows[0].total), page, limit },
    })
  } catch (error) {
    console.error("Get companies error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent"])
    if (!auth.ok) return auth.response

    const { name, contact_person, email, phone, address, country, requirements } = await request.json()

    const companyResult = await query(
      `INSERT INTO companies (name, contact_person, email, phone, address, country, requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [name, contact_person, email, phone, address, country, requirements],
    )

    return NextResponse.json({
      success: true,
      message: "Company created successfully",
      companyId: companyResult.rows[0].id,
    })
  } catch (error) {
    console.error("Create company error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
