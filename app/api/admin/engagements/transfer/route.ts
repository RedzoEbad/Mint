import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "admin"])
    if (!auth.ok) return auth.response

    const { candidate_id, company_id, new_agent_id, unlock } = await request.json()
    if (!candidate_id || !company_id || !new_agent_id) {
      return NextResponse.json({ success: false, message: "candidate_id, company_id, new_agent_id required" }, { status: 400 })
    }

    const exists = await query(
      `SELECT id, agent_id, locked_by_workflow FROM candidate_company_engagements WHERE candidate_id = $1 AND company_id = $2`,
      [candidate_id, company_id],
    )
    if (exists.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Engagement not found" }, { status: 404 })
    }

    const current = exists.rows[0]
    if (current.agent_id === new_agent_id) {
      return NextResponse.json({ success: false, message: "Engagement already owned by the selected agent" }, { status: 400 })
    }

    if (current.locked_by_workflow && !unlock) {
      return NextResponse.json({ success: false, message: "Engagement is locked by workflow. Use unlock option to proceed." }, { status: 409 })
    }

    // Ensure the target agent is assigned to this company; if not, create active assignment
    const assignment = await query(
      `SELECT id FROM agent_company_assignments WHERE agent_id = $1 AND company_id = $2 AND active = true`,
      [new_agent_id, company_id],
    )
    if (assignment.rows.length === 0) {
      await query(
        `INSERT INTO agent_company_assignments (agent_id, company_id, active) VALUES ($1, $2, true)
         ON CONFLICT (agent_id, company_id) DO UPDATE SET active = true, updated_at = now()`,
        [new_agent_id, company_id],
      )
    }

    // Transfer ownership on engagement and optionally unlock
    // Always unlock on transfer to keep process seamless
    await query(
      `UPDATE candidate_company_engagements 
       SET agent_id = $1, 
           locked_by_workflow = false,
           updated_at = now()
       WHERE candidate_id = $2 AND company_id = $3`,
      [new_agent_id, candidate_id, company_id],
    )

    // Also reassign any related workflow stages to the new agent
    await query(
      `UPDATE workflow_stages SET assigned_agent = $1, updated_at = now()
       WHERE candidate_id = $2 AND company_id = $3`,
      [new_agent_id, candidate_id, company_id],
    )

    return NextResponse.json({ success: true, message: "Engagement transferred and workflows reassigned" })
  } catch (e) {
    console.error("Engagement transfer error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


