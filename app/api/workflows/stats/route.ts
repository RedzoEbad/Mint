import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent", "admin"])
    if (!auth.ok) return auth.response

    // For process agents, scope to their assigned workflows; admins see all
    const isAgent = auth.payload.role === "process_agent"

    // Active workflows (in_progress)
    const activeRes = await query(
      `SELECT COUNT(*)::int AS cnt
       FROM workflow_stages w
       ${isAgent ? "WHERE w.assigned_agent = $1 AND w.overall_status = 'in_progress'" : "WHERE w.overall_status = 'in_progress'"}`,
      isAgent ? [auth.payload.userId] : [],
    )

    // Created today (UTC date)
    const todayRes = await query(
      `SELECT COUNT(*)::int AS cnt
       FROM workflow_stages w
       ${isAgent ? "WHERE w.assigned_agent = $1 AND w.created_at::date = CURRENT_DATE" : "WHERE w.created_at::date = CURRENT_DATE"}`,
      isAgent ? [auth.payload.userId] : [],
    )

    // Pending interviews = engagements where interview_status in ('pending','scheduled') for agent scope
    const pendingInterviewsRes = await query(
      `SELECT COUNT(*)::int AS cnt
       FROM candidate_company_engagements e
       ${isAgent ? "INNER JOIN agent_company_assignments aca ON aca.agent_id = $1 AND aca.company_id = e.company_id AND aca.active = true" : ""}
       WHERE e.interview_status IN ('pending','scheduled')`,
      isAgent ? [auth.payload.userId] : [],
    )

    // Breakdown of workflow overall_status
    const breakdownRes = await query(
      `SELECT w.overall_status, COUNT(*)::int AS cnt
       FROM workflow_stages w
       ${isAgent ? "WHERE w.assigned_agent = $1" : ""}
       GROUP BY w.overall_status`,
      isAgent ? [auth.payload.userId] : [],
    )

    const statusBreakdown: Record<string, number> = {}
    for (const r of breakdownRes.rows) {
      statusBreakdown[String(r.overall_status)] = Number(r.cnt)
    }

    return NextResponse.json({
      success: true,
      data: {
        active: Number(activeRes.rows[0]?.cnt || 0),
        today: Number(todayRes.rows[0]?.cnt || 0),
        pending_interviews: Number(pendingInterviewsRes.rows[0]?.cnt || 0),
        statusBreakdown,
      },
    })
  } catch (e) {
    console.error("Workflows stats error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
