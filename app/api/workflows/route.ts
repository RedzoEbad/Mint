import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"
import { withTiming, timedQuery } from "@/lib/performance"

// Dynamic route - can't use revalidate with request headers

export const GET = withTiming(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent"])
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const assignedAgent = searchParams.get("assigned_agent") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (status) {
      paramCount++
      whereClause += ` AND w.overall_status = $${paramCount}`
      params.push(status)
    }

    if (assignedAgent) {
      paramCount++
      whereClause += ` AND w.assigned_agent = $${paramCount}`
      params.push(assignedAgent)
    }

    // If user is process_agent (not super_admin), only show their assigned workflows
    if (auth.payload.role === "process_agent") {
      paramCount++
      whereClause += ` AND w.assigned_agent = $${paramCount}`
      params.push(auth.payload.userId)
    }

    const workflowsResult = await timedQuery(
      () => query(
        `SELECT 
          w.*,
          c.full_name as candidate_name,
          c.passport_no,
          c.post_applied_for,
          comp.name as company_name,
          u.full_name as agent_name
        FROM workflow_stages w
        LEFT JOIN candidates c ON w.candidate_id = c.id
        LEFT JOIN companies comp ON w.company_id = comp.id
        LEFT JOIN users u ON w.assigned_agent = u.id
        ${whereClause}
        ORDER BY w.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset],
      ),
      "Workflows List Query"
    )

    return NextResponse.json({
      success: true,
      data: workflowsResult.rows,
    })
  } catch (error) {
    console.error("Get workflows error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}, "Workflows API")

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent"])
    if (!auth.ok) return auth.response

    const { candidate_id, company_id } = await request.json()

    // Check if workflow already exists for this candidate-company pair
    const existingResult = await query("SELECT id FROM workflow_stages WHERE candidate_id = $1 AND company_id = $2", [
      candidate_id,
      company_id,
    ])

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: "Workflow already exists for this candidate-company pair" },
        { status: 400 },
      )
    }

    const workflowResult = await query(
      `INSERT INTO workflow_stages (candidate_id, company_id, assigned_agent)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [candidate_id, company_id, auth.payload.userId],
    )

    return NextResponse.json({
      success: true,
      message: "Workflow created successfully",
      workflowId: workflowResult.rows[0].id,
    })
  } catch (error) {
    console.error("Create workflow error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
