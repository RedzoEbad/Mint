import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent", "admin"])
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const job = (searchParams.get("job") || "").trim()
    const keywords = (searchParams.get("q") || "").trim()
    const algorithm = (searchParams.get("algo") || "keyword").toLowerCase()
    const companyId = (searchParams.get("company_id") || "").trim()
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let where = "WHERE 1=1"
    const params: any[] = []
    let p = 0

    if (job) {
      p++; where += ` AND (c.post_applied_for ILIKE $${p})`; params.push(`%${job}%`)
    }

    if (keywords) {
      p++; const kw = `%${keywords}%`
      where += ` AND (
        c.full_name ILIKE $${p} OR c.passport_no ILIKE $${p} OR c.post_applied_for ILIKE $${p}
      )`
      params.push(kw)
    }

    const totalRes = await query(`SELECT COUNT(*) AS total FROM candidates c ${where}`, params)

    // Clone where-params, then add scoring and paging params with correct indexes
    const listParams: any[] = [...params]
    const companyIdParam = companyId ? companyId : null
    const companyIdIdx = ++p; listParams.push(companyIdParam)
    const jobPatternIdx = ++p; listParams.push(job ? `%${job}%` : "")
    const kwPatternIdx = ++p; listParams.push(keywords ? `%${keywords}%` : "")
    const limitIdx = ++p; listParams.push(limit)
    const offsetIdx = ++p; listParams.push(offset)

    // If process agent, ensure companyId is provided and agent is assigned
    if (auth.payload.role === "process_agent") {
      if (!companyId) {
        return NextResponse.json({ success: false, message: "Select a company" }, { status: 400 })
      }
      const assigned = await query(
        `SELECT 1 FROM agent_company_assignments WHERE agent_id = $1 AND company_id = $2 AND active = true LIMIT 1`,
        [auth.payload.userId, companyId],
      )
      if (assigned.rows.length === 0) {
        return NextResponse.json({ success: false, message: "Not assigned to this company" }, { status: 403 })
      }
    }

    const listRes = await query(
      `SELECT 
        c.id,
        c.full_name,
        c.passport_no,
        c.post_applied_for,
        c.status,
        c.created_at,
        w.id AS workflow_id,
        aw.id AS active_other_workflow_id,
        comp2.name AS active_other_company,
        NULL::text AS latest_interview_result,
        NULL::text AS latest_interview_status,
        e.agent_id AS eng_agent_id,
        e.interview_status AS eng_interview_status,
        e.interview_result AS eng_interview_result,
        e.locked_by_workflow AS eng_locked,
        (
          CASE WHEN $${jobPatternIdx} <> '' AND c.post_applied_for ILIKE $${jobPatternIdx} THEN 2 ELSE 0 END
          + CASE WHEN $${kwPatternIdx} <> '' AND (c.full_name ILIKE $${kwPatternIdx} OR c.post_applied_for ILIKE $${kwPatternIdx}) THEN 1 ELSE 0 END
        ) as score
       FROM candidates c
       LEFT JOIN workflow_stages w 
         ON w.candidate_id = c.id 
        AND ($${companyIdIdx}::uuid IS NOT NULL AND w.company_id = $${companyIdIdx}::uuid)
       LEFT JOIN workflow_stages aw 
         ON aw.candidate_id = c.id 
        AND ($${companyIdIdx}::uuid IS NOT NULL 
             AND aw.company_id <> $${companyIdIdx}::uuid 
             AND aw.overall_status IN ('initiated','in_progress'))
       LEFT JOIN companies comp2 ON comp2.id = aw.company_id
       LEFT JOIN candidate_company_engagements e 
         ON e.candidate_id = c.id 
        AND ($${companyIdIdx}::uuid IS NOT NULL AND e.company_id = $${companyIdIdx}::uuid)
       LEFT JOIN agent_company_assignments eaca
         ON eaca.agent_id = e.agent_id AND eaca.company_id = $${companyIdIdx}::uuid AND eaca.active = true
       ${where}
       ${auth.payload.role === 'process_agent' ? `AND (e.agent_id IS NULL OR e.agent_id = '${auth.payload.userId}'::uuid OR eaca.id IS NULL)` : ''}
       ORDER BY score DESC, c.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    )

    return NextResponse.json({
      success: true,
      data: listRes.rows,
      meta: { total: Number.parseInt(totalRes.rows[0].total), page, limit }
    })
  } catch (e) {
    console.error("Candidates search error", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


