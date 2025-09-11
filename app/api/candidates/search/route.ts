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
    const jobPatternIdx = ++p; listParams.push(job ? `%${job}%` : "")
    const kwPatternIdx = ++p; listParams.push(keywords ? `%${keywords}%` : "")
    const limitIdx = ++p; listParams.push(limit)
    const offsetIdx = ++p; listParams.push(offset)

    const listRes = await query(
      `SELECT 
        c.id,
        c.full_name,
        c.passport_no,
        c.post_applied_for,
        c.status,
        c.created_at,
        (
          CASE WHEN $${jobPatternIdx} <> '' AND c.post_applied_for ILIKE $${jobPatternIdx} THEN 2 ELSE 0 END
          + CASE WHEN $${kwPatternIdx} <> '' AND (c.full_name ILIKE $${kwPatternIdx} OR c.post_applied_for ILIKE $${kwPatternIdx}) THEN 1 ELSE 0 END
        ) as score
       FROM candidates c
       ${where}
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


