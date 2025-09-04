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
    if (!payload || !["super_admin", "process_agent"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      whereClause += ` AND (name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount} OR requirements ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    const companiesResult = await query(`SELECT * FROM companies ${whereClause} ORDER BY created_at DESC`, params)

    return NextResponse.json({
      success: true,
      data: companiesResult.rows,
    })
  } catch (error) {
    console.error("Get companies error:", error)
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
    if (!payload || !["super_admin", "process_agent"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 })
    }

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
