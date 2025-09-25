import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"
import { withTiming, timedQuery } from "@/lib/performance"

// Dynamic route - can't use revalidate with request headers

export const GET = withTiming(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent", "admin"])
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const assignedAgent = searchParams.get("assigned_agent") || ""
    const companyId = searchParams.get("company_id") || ""
    const search = searchParams.get("search") || ""
    const sort = (searchParams.get("sort") || "created_at").toLowerCase()
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

    if (companyId) {
      paramCount++
      whereClause += ` AND w.company_id = $${paramCount}`
      params.push(companyId)
    }

    if (search) {
      paramCount++
      whereClause += ` AND (c.full_name ILIKE $${paramCount} OR c.passport_no ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    // If user is process_agent (not super_admin), only show their assigned workflows
    if (auth.payload.role === "process_agent") {
      paramCount++
      whereClause += ` AND w.assigned_agent = $${paramCount}`
      params.push(auth.payload.userId)
    }

    const totalResult = await timedQuery(
      () => query(
        `SELECT COUNT(*) AS total
         FROM workflow_stages w
         LEFT JOIN candidates c ON w.candidate_id = c.id
         ${whereClause}`,
        params,
      ),
      "Workflows Total Count Query"
    )

    const orderBy = sort === "updated_at" ? "w.updated_at DESC" : "w.created_at DESC"

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
        ORDER BY ${orderBy}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset],
      ),
      "Workflows List Query"
    )

    return NextResponse.json({
      success: true,
      data: workflowsResult.rows,
      total: Number.parseInt(totalResult.rows[0].total),
      page,
      limit,
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

    // Process agents can only create workflows for companies assigned to them
    if (auth.payload.role === "process_agent") {
      const assignment = await query(
        `SELECT 1 FROM agent_company_assignments 
         WHERE agent_id = $1 AND company_id = $2 AND active = true
         LIMIT 1`,
        [auth.payload.userId, company_id],
      )
      if (assignment.rows.length === 0) {
        return NextResponse.json({ success: false, message: "Not assigned to this company" }, { status: 403 })
      }
    }

    // Engagement checks: ensure interview selected and lock ownership
    const engagement = await query(
      `SELECT agent_id, interview_status, interview_result, locked_by_workflow FROM candidate_company_engagements WHERE candidate_id = $1 AND company_id = $2`,
      [candidate_id, company_id],
    )

    if (engagement.rows.length > 0) {
      const e = engagement.rows[0]
      if (e.locked_by_workflow && e.agent_id && e.agent_id !== auth.payload.userId) {
        return NextResponse.json({ success: false, message: "Engagement locked by another agent" }, { status: 403 })
      }
      if (e.interview_result !== 'selected') {
        return NextResponse.json({ success: false, message: "Interview not selected yet" }, { status: 400 })
      }
    } else {
      // If no engagement row yet, create a placeholder requiring interview selected before start
      return NextResponse.json({ success: false, message: "No engagement found. Schedule and pass interview first." }, { status: 400 })
    }

    // Check if workflow already exists for this candidate-company pair
    const existingResult = await query("SELECT id FROM workflow_stages WHERE candidate_id = $1 AND company_id = $2", [
      candidate_id,
      company_id,
    ])

    if (existingResult.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Workflow already exists. Redirecting to existing workflow",
        workflowId: existingResult.rows[0].id,
      })
    }

    // Business rule: If a candidate has an active workflow (initiated/in_progress) with another company,
    // a process agent cannot start another workflow for a different company.
    if (auth.payload.role === "process_agent") {
      const activeResult = await query(
        `SELECT id, company_id FROM workflow_stages 
         WHERE candidate_id = $1 
           AND overall_status IN ('initiated', 'in_progress')
         ORDER BY created_at DESC
         LIMIT 1`,
        [candidate_id],
      )
      if (activeResult.rows.length > 0) {
        const active = activeResult.rows[0]
        if (active.company_id !== company_id) {
          return NextResponse.json(
            {
              success: false,
              message: "Candidate already has an active workflow with another company. Complete or cancel it first.",
            },
            { status: 400 },
          )
        }
      }
    }

    // Require interview to be passed (selected): prefer engagement as source of truth
    if (engagement.rows.length > 0) {
      const e = engagement.rows[0]
      if (!(e.interview_status === 'completed' && e.interview_result === 'selected')) {
        return NextResponse.json(
          { success: false, message: "Interview not passed or not completed yet for this company" },
          { status: 400 },
        )
      }
    }

    const workflowResult = await query(
      `INSERT INTO workflow_stages (candidate_id, company_id, assigned_agent)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [candidate_id, company_id, auth.payload.userId],
    )

    // Lock engagement to this agent upon workflow creation
    await query(
      `UPDATE candidate_company_engagements SET agent_id = $1, locked_by_workflow = true, updated_at = now() WHERE candidate_id = $2 AND company_id = $3`,
      [auth.payload.userId, candidate_id, company_id],
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
