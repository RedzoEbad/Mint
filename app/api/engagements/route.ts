import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { agentCompanyAssignments, candidateCompanyEngagements, companies, candidates } from "@/lib/db/schema"
import { and, eq, sql } from "drizzle-orm"

export async function GET(request: Request) {
  const auth = await requireAuth(request as any, ["process_agent", "admin", "super_admin"]) as any
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)))
  const companyId = searchParams.get("company_id") || ""

  if (auth.payload.role === "process_agent") {
    if (!companyId) return NextResponse.json({ success: true, data: [], meta: { total: 0 } })
    const assigned = await db.select().from(agentCompanyAssignments).where(and(eq(agentCompanyAssignments.agentId, auth.payload.userId), eq(agentCompanyAssignments.companyId, companyId)))
    if (!assigned.length) return NextResponse.json({ success: false, message: "Not assigned to this company" }, { status: 403 })
  }

  const rows = await db
    .select({
      id: candidateCompanyEngagements.id,
      candidate_id: candidateCompanyEngagements.candidateId,
      candidate_name: candidates.fullName,
      company_name: companies.name,
      interview_status: candidateCompanyEngagements.interviewStatus,
      interview_result: candidateCompanyEngagements.interviewResult,
      note: candidateCompanyEngagements.note,
      workflow_id: sql<string | null>`w.id`,
      agent_id: candidateCompanyEngagements.agentId,
      locked_by_workflow: candidateCompanyEngagements.lockedByWorkflow,
    })
    .from(candidateCompanyEngagements)
    .leftJoin(candidates, eq(candidates.id, candidateCompanyEngagements.candidateId))
    .leftJoin(companies, eq(companies.id, candidateCompanyEngagements.companyId))
    .leftJoin(sql/* sql */`workflow_stages w`, sql/* on */`w.candidate_id = ${candidateCompanyEngagements.candidateId} AND w.company_id = ${candidateCompanyEngagements.companyId} AND w.overall_status IN ('initiated','in_progress')`)
    .where(companyId ? eq(candidateCompanyEngagements.companyId, companyId) : undefined)
    .limit(limit)
    .offset((page - 1) * limit)

  return NextResponse.json({ success: true, data: rows, meta: { total: rows.length } })
}

export async function POST(request: Request) {
  const auth = await requireAuth(request as any, ["process_agent", "admin", "super_admin"]) as any
  if (!auth.ok) return auth.response
  const { candidate_id, company_id, note } = await request.json().catch(() => ({}))
  if (!candidate_id || !company_id) return NextResponse.json({ success: false, message: "candidate_id and company_id required" }, { status: 400 })

  if (auth.payload.role === "process_agent") {
    const assigned = await db.select().from(agentCompanyAssignments).where(and(eq(agentCompanyAssignments.agentId, auth.payload.userId), eq(agentCompanyAssignments.companyId, company_id)))
    if (!assigned.length) return NextResponse.json({ success: false, message: "Not assigned to this company" }, { status: 403 })

    // Prevent stealing candidate if engaged by another active agent for this company
    const existing = await db.select().from(candidateCompanyEngagements)
      .where(and(eq(candidateCompanyEngagements.candidateId, candidate_id), eq(candidateCompanyEngagements.companyId, company_id)))
    if (existing.length && existing[0].agentId && existing[0].agentId !== auth.payload.userId) {
      const activeOwner = await db.select().from(agentCompanyAssignments)
        .where(and(eq(agentCompanyAssignments.agentId, existing[0].agentId as any), eq(agentCompanyAssignments.companyId, company_id), eq(agentCompanyAssignments.active, true)))
      if (activeOwner.length) {
        return NextResponse.json({ success: false, message: "Candidate already engaged by another active agent" }, { status: 409 })
      }
    }
  }

  const [row] = await db
    .insert(candidateCompanyEngagements)
    .values({ candidateId: candidate_id, companyId: company_id, agentId: auth.payload.userId, note })
    .onConflictDoUpdate({ target: [candidateCompanyEngagements.candidateId, candidateCompanyEngagements.companyId], set: { agentId: auth.payload.userId, note } })
    .returning()

  return NextResponse.json({ success: true, data: row })
}
