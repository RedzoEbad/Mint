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
    const status = searchParams.get("status") || ""

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (status) {
      paramCount++
      whereClause += ` AND i.interview_status = $${paramCount}`
      params.push(status)
    }

    // If user is process_agent, only show interviews they conducted
    if (payload.role === "process_agent") {
      paramCount++
      whereClause += ` AND i.conducted_by = $${paramCount}`
      params.push(payload.userId)
    }

    const interviewsResult = await query(
      `SELECT 
        i.*,
        c.full_name as candidate_name,
        c.passport_no,
        comp.name as company_name,
        u.full_name as conducted_by_name
      FROM interviews i
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN companies comp ON i.company_id = comp.id
      LEFT JOIN users u ON i.conducted_by = u.id
      ${whereClause}
      ORDER BY i.interview_date DESC`,
      params,
    )

    return NextResponse.json({
      success: true,
      data: interviewsResult.rows,
    })
  } catch (error) {
    console.error("Get interviews error:", error)
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

    const { candidate_id, company_id, interview_type, interview_date, feedback, result } = await request.json()

    const interviewResult = await query(
      `INSERT INTO interviews (candidate_id, company_id, interview_type, interview_date, feedback, result, conducted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [candidate_id, company_id, interview_type, interview_date, feedback, result, payload.userId],
    )

    return NextResponse.json({
      success: true,
      message: "Interview scheduled successfully",
      interviewId: interviewResult.rows[0].id,
    })
  } catch (error) {
    console.error("Create interview error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
