import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"
import { withTiming, timedQuery, logSlowOperation } from "@/lib/performance"

// Dynamic route - can't use revalidate with request headers

export const GET = withTiming(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent"])
    if (!auth.ok) return auth.response

    let whereClause = ""
    const params: any[] = []

    // If user is process_agent, only show their stats
    if (auth.payload.role === "process_agent") {
      whereClause = "WHERE assigned_agent = $1"
      params.push(auth.payload.userId)
    }

    const [activeResult, todayResult, statusResult, interviewsResult] = await Promise.all([
      // Active workflows
      timedQuery(
        () => query(
          `SELECT COUNT(*) as active FROM workflow_stages ${whereClause} ${whereClause ? "AND" : "WHERE"} overall_status IN ('initiated', 'in_progress')`,
          params,
        ),
        "Active Workflows Count"
      ),

      // Today's completed workflows
      timedQuery(
        () => query(
          `SELECT COUNT(*) as today FROM workflow_stages ${whereClause} ${whereClause ? "AND" : "WHERE"} overall_status = 'completed' AND DATE(updated_at) = CURRENT_DATE`,
          params,
        ),
        "Today's Completed Count"
      ),

      // Status breakdown
      timedQuery(
        () => query(
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
        "Status Breakdown Query"
      ),

      // Pending interviews count
      timedQuery(
        () => query(
          `
          SELECT COUNT(*) as pending_interviews
          FROM interviews i
          JOIN workflow_stages w ON i.candidate_id = w.candidate_id
          WHERE i.interview_status = 'scheduled' 
          ${whereClause ? `AND w.assigned_agent = $${params.length}` : ""}
        `,
          whereClause ? params : [],
        ),
        "Pending Interviews Count"
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
}, "Workflow Stats API")
