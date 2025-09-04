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

    let whereClause = ""
    const params: any[] = []

    // If user is process_agent, only show their stats
    if (payload.role === "process_agent") {
      whereClause = "WHERE assigned_agent = $1"
      params.push(payload.userId)
    }

    const [activeResult, todayResult, statusResult, interviewsResult] = await Promise.all([
      // Active workflows
      query(
        `SELECT COUNT(*) as active FROM workflow_stages ${whereClause} ${whereClause ? "AND" : "WHERE"} overall_status IN ('initiated', 'in_progress')`,
        params,
      ),

      // Today's completed workflows
      query(
        `SELECT COUNT(*) as today FROM workflow_stages ${whereClause} ${whereClause ? "AND" : "WHERE"} overall_status = 'completed' AND DATE(updated_at) = CURRENT_DATE`,
        params,
      ),

      // Status breakdown
      query(
        `
        SELECT 
          overall_status,
          COUNT(*) as count
        FROM workflow_stages 
        ${whereClause}
        GROUP BY overall_status
      `,
        params,
      ),

      // Pending interviews count
      query(
        `
        SELECT COUNT(*) as pending_interviews
        FROM interviews i
        JOIN workflow_stages w ON i.candidate_id = w.candidate_id
        WHERE i.interview_status = 'scheduled' 
        ${whereClause ? `AND w.assigned_agent = $${params.length}` : ""}
      `,
        whereClause ? params : [],
      ),
    ])

    const stats = {
      active: Number.parseInt(activeResult.rows[0].active),
      today: Number.parseInt(todayResult.rows[0].today),
      pending_interviews: Number.parseInt(interviewsResult.rows[0].pending_interviews),
      statusBreakdown: statusResult.rows.reduce((acc, row) => {
        acc[row.overall_status] = Number.parseInt(row.count)
        return acc
      }, {}),
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Get workflow stats error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
