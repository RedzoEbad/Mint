import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent", "admin"])
    if (!auth.ok) return auth.response
    const { id } = await context.params
    const { interview_status, interview_result, note } = await request.json()

    // Only allow updates if not locked by another active agent; admins can override; agents can override if owning agent inactive
    const row = await query(`SELECT e.locked_by_workflow, e.agent_id, e.company_id, aca.active AS owner_active
      FROM candidate_company_engagements e
      LEFT JOIN agent_company_assignments aca ON aca.agent_id = e.agent_id AND aca.company_id = e.company_id
      WHERE e.id = $1`, [id])
    if (!row.rows.length) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
    if (row.rows[0].locked_by_workflow && auth.payload.role === "process_agent") {
      // If owner is inactive for this company, allow override
      if (row.rows[0].agent_id && row.rows[0].agent_id !== auth.payload.userId && row.rows[0].owner_active) {
        return NextResponse.json({ success: false, message: "Locked by workflow" }, { status: 403 })
      }
    }

    const updates: string[] = []
    const params: any[] = []
    let p = 0
    if (interview_status !== undefined) { p++; updates.push(`interview_status = $${p}`); params.push(interview_status) }
    if (interview_result !== undefined) { p++; updates.push(`interview_result = $${p}`); params.push(interview_result) }
    if (note !== undefined) { p++; updates.push(`note = $${p}`); params.push(note) }
    if (updates.length === 0) return NextResponse.json({ success: false, message: "No fields" }, { status: 400 })
    p++; params.push(id)
    await query(`UPDATE candidate_company_engagements SET ${updates.join(", ")}, updated_at = now() WHERE id = $${p}`, params)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Engagement update error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent", "admin"]) as any
    if (!auth.ok) return auth.response
    const { id } = await context.params

    // Process agents: allow delete if (they are owner AND no active workflow) OR (owner inactive AND no active workflow)
    if (auth.payload.role === "process_agent") {
      const row = await query(
        `SELECT e.agent_id, e.company_id, e.locked_by_workflow,
                EXISTS (
                  SELECT 1 FROM workflow_stages w
                  WHERE w.candidate_id = e.candidate_id AND w.company_id = e.company_id AND w.overall_status IN ('initiated','in_progress')
                ) AS has_active_workflow,
                aca.active AS owner_active
         FROM candidate_company_engagements e
         LEFT JOIN agent_company_assignments aca ON aca.agent_id = e.agent_id AND aca.company_id = e.company_id
         WHERE e.id = $1`,
        [id],
      )
      if (!row.rows.length) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
      const r = row.rows[0]
      if (r.has_active_workflow) return NextResponse.json({ success: false, message: "Workflow in progress" }, { status: 403 })
      const isOwner = String(r.agent_id || "") === String(auth.payload.userId)
      const ownerInactive = r.owner_active === false || r.owner_active === null
      if (!(isOwner || ownerInactive)) return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 })
    }

    await query(`DELETE FROM candidate_company_engagements WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Engagement delete error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


