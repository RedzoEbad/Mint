import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "admin"])
    if (!auth.ok) return auth.response

    const res = await query(
      `SELECT aca.id, aca.agent_id, aca.company_id, aca.active, u.full_name AS agent_name, u.email AS agent_email, c.name AS company_name
       FROM agent_company_assignments aca
       INNER JOIN users u ON u.id = aca.agent_id
       INNER JOIN companies c ON c.id = aca.company_id
       ORDER BY c.name ASC, u.full_name ASC`,
      [],
    )

    return NextResponse.json({ success: true, data: res.rows })
  } catch (e) {
    console.error("Assignments GET error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "admin"])
    if (!auth.ok) return auth.response
    const { agent_id, company_id } = await request.json()
    if (!agent_id || !company_id) return NextResponse.json({ success: false, message: "agent_id and company_id required" }, { status: 400 })

    // Upsert active assignment
    await query(
      `INSERT INTO agent_company_assignments (agent_id, company_id, active)
       VALUES ($1, $2, true)
       ON CONFLICT (agent_id, company_id) WHERE active = true DO UPDATE SET active = true, updated_at = now()`,
      [agent_id, company_id],
    )

    // Optionally set agent on existing engagement rows without owner
    await query(
      `UPDATE candidate_company_engagements SET agent_id = COALESCE(agent_id, $1), updated_at = now()
       WHERE company_id = $2 AND agent_id IS NULL`,
      [agent_id, company_id],
    )

    return NextResponse.json({ success: true, message: "Assigned" })
  } catch (e) {
    console.error("Assignments POST error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


