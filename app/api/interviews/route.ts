import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"
import { withTiming, timedQuery } from "@/lib/performance"

// Dynamic route - can't use revalidate with request headers

export const GET = withTiming(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent"]) // Admin can view via reports, not here
    if (!auth.ok) return auth.response

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
    if (auth.payload.role === "process_agent") {
      paramCount++
      whereClause += ` AND i.conducted_by = $${paramCount}`
      params.push(auth.payload.userId)
    }

    const interviewsResult = await timedQuery(() => query(
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
      ORDER BY i.interview_date DESC`, params), "Interviews List Query")

    return NextResponse.json({
      success: true,
      data: interviewsResult.rows,
    })
  } catch (error) {
    console.error("Get interviews error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}, "Interviews GET")

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent"])
    if (!auth.ok) return auth.response

    const { candidate_id, company_id, interview_type, interview_date, feedback, result } = await request.json()

    const interviewResult = await query(
      `INSERT INTO interviews (candidate_id, company_id, interview_type, interview_date, feedback, result, conducted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [candidate_id, company_id, interview_type, interview_date, feedback, result, auth.payload.userId],
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
