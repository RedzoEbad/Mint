import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"
import { logger } from "@/lib/logger"

// Get a single workflow with candidate/company context
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent", "admin"])
    if (!auth.ok) return auth.response
    const { id } = await context.params

    const wf = await query(
      `SELECT 
         w.*, 
         c.full_name as candidate_name, 
         c.passport_no as passport_no, 
         comp.name as company_name, 
         u.full_name as agent_name
       FROM workflow_stages w
       LEFT JOIN candidates c ON w.candidate_id = c.id
       LEFT JOIN companies comp ON w.company_id = comp.id
       LEFT JOIN users u ON w.assigned_agent = u.id
       WHERE w.id = $1`,
      [id],
    )
    if (wf.rows.length === 0) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    // Process agents can only access their own workflows
    if (auth.payload.role === "process_agent" && wf.rows[0].assigned_agent !== auth.payload.userId) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Try to enrich with stage detail tables if available (avoid errors by checking existence first)
    const exists = async (qualifiedTable: string) => {
      try {
        const r = await query(`SELECT to_regclass($1) as oid`, [qualifiedTable])
        return Boolean(r.rows?.[0]?.oid)
      } catch {
        return false
      }
    }

    if (await exists("public.medical_details")) {
      const m = await query(
        `SELECT medical_center, medical_report_no, document_url AS medical_document_url FROM medical_details WHERE workflow_stage_id = $1`,
        [id],
      )
      if (m.rows[0]) Object.assign(wf.rows[0], m.rows[0])
    }
    if (await exists("public.visa_details")) {
      const v = await query(
        `SELECT visa_file_no, visa_embassy, document_url AS visa_document_url FROM visa_details WHERE workflow_stage_id = $1`,
        [id],
      )
      if (v.rows[0]) Object.assign(wf.rows[0], v.rows[0])
    }
    if (await exists("public.protector_details")) {
      const p = await query(
        `SELECT protector_no, document_url AS protector_document_url FROM protector_details WHERE workflow_stage_id = $1`,
        [id],
      )
      if (p.rows[0]) Object.assign(wf.rows[0], p.rows[0])
    }
    if (await exists("public.flight_details")) {
      const f = await query(
        `SELECT flight_pnr, flight_airline, document_url AS flight_document_url FROM flight_details WHERE workflow_stage_id = $1`,
        [id],
      )
      if (f.rows[0]) Object.assign(wf.rows[0], f.rows[0])
    }

    // Gather multiple documents if the table exists
    if (await exists("public.stage_documents")) {
      const docs = await query(
        `SELECT stage_key, url, filename, mime_type, size_bytes, created_at FROM stage_documents WHERE workflow_stage_id = $1 ORDER BY created_at DESC`,
        [id],
      )
      const grouped: Record<string, any[]> = {}
      for (const d of docs.rows as any[]) {
        grouped[d.stage_key] = grouped[d.stage_key] || []
        grouped[d.stage_key].push({ url: d.url, filename: d.filename, mime_type: d.mime_type, size_bytes: d.size_bytes, created_at: d.created_at })
      }
      wf.rows[0].documents = grouped
    }

    // Ensure payment flags reflect latest payments even if legacy rows missed an update
    try {
      const payments = await query(
        `SELECT payment_type FROM payments WHERE workflow_id = $1 AND payment_status = 'paid'`,
        [id],
      )
      const paidTypes = new Set(payments.rows.map((r: any) => String(r.payment_type).toLowerCase()))
      const stageKeys = ["medical", "visa", "protector", "passport", "flight"]
      for (const key of stageKeys) {
        if (paidTypes.has(key)) {
          wf.rows[0][`${key}_payment_status`] = "paid"
        }
      }
    } catch {}

    return NextResponse.json({ success: true, data: wf.rows[0] })
  } catch (e) {
    console.error("Get workflow error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// Update workflow stage statuses
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Admin can only view workflows; updates limited to super_admin and process_agent
    const auth = await requireAuth(request, ["super_admin", "process_agent"])
    if (!auth.ok) return auth.response
    const { id } = await context.params

    const body = await request.json()
    const action: string | undefined = body.action
    let stage: string | undefined = body.stage
    let status: string | undefined = body.status
    const retractMode: "soft" | "hard" | undefined = body.retract_mode
    const notes: string | undefined = body.notes

    const validStages = ["medical", "visa", "protector", "passport", "flight"] as const
    const validStatus = ["pending", "completed", "rejected"]

    // Fetch to validate ownership when process_agent
    const wfRes = await query("SELECT assigned_agent FROM workflow_stages WHERE id = $1", [id])
    if (wfRes.rows.length === 0) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    if (auth.payload.role === "process_agent" && wfRes.rows[0].assigned_agent !== auth.payload.userId) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    if (action === "reset") {
      // Reset all stages to pending (admin/super_admin only)
      if (!["admin", "super_admin"].includes(auth.payload.role)) {
      return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 })
    }

      await query(
        `UPDATE workflow_stages SET 
          medical_status = 'pending',
          visa_status = 'pending',
          protector_status = 'pending',
          passport_status = 'pending',
          flight_status = 'pending',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [id],
      )

      return NextResponse.json({ success: true, message: "Workflow reset successfully" })
    }

    if (!stage || !validStages.includes(stage as any)) {
      return NextResponse.json({ success: false, message: "Invalid stage" }, { status: 400 })
    }

    if (!status || !validStatus.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 })
    }

    // Check if we're retracting (moving to a previous stage)
    const currentWf = await query("SELECT * FROM workflow_stages WHERE id = $1", [id])
    if (currentWf.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Workflow not found" }, { status: 404 })
    }

    const currentStage = currentWf.rows[0]
    const stageOrder = ["medical", "visa", "protector", "passport", "flight"]
    const currentStageIndex = stageOrder.indexOf(stage)
    const targetStageIndex = stageOrder.indexOf(stage)

    // If retracting to a previous stage: two modes
    // - hard (default): set target to pending and reset all subsequent stages + payment statuses
    // - soft: set target to pending ONLY, leave subsequent stages untouched (for minor edits)
    if (status === "pending" && currentStage[`${stage}_status`] === "completed") {
      const mode = retractMode || "hard"
      if (mode === "hard") {
        const stagesToReset = stageOrder.slice(targetStageIndex + 1)
        for (const resetStage of stagesToReset) {
          await query(
            `UPDATE workflow_stages SET 
              ${resetStage}_status = 'pending',
              ${resetStage}_payment_status = 'pending',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $1`,
            [id],
          )
        }
      }
    }

    // Update the specific stage
    if (notes !== undefined) {
      await query(
        `UPDATE workflow_stages SET
          ${stage}_status = $1,
          ${stage}_notes = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3`,
        [status, notes, id],
      )
    } else {
      await query(
        `UPDATE workflow_stages SET
          ${stage}_status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2`,
        [status, id],
      )
    }

    // Upsert stage detail payload if provided
    try {
      if (stage === "medical" && (body.medical_center !== undefined || body.medical_report_no !== undefined || body.document_url !== undefined)) {
        const up = await query(
          `INSERT INTO medical_details (workflow_stage_id, medical_center, medical_report_no, document_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (workflow_stage_id) DO UPDATE SET
             medical_center = EXCLUDED.medical_center,
             medical_report_no = EXCLUDED.medical_report_no,
             document_url = COALESCE(EXCLUDED.document_url, medical_details.document_url),
             updated_at = now()
           RETURNING id`,
          [id, body.medical_center ?? null, body.medical_report_no ?? null, body.document_url ?? null],
        )
        const did = up.rows?.[0]?.id
        if (did) {
          await query(
            `INSERT INTO workflow_stage_results (workflow_stage_id, stage_key, detail_id)
             VALUES ($1, 'medical', $2)
             ON CONFLICT (workflow_stage_id, stage_key) DO UPDATE SET detail_id = EXCLUDED.detail_id`,
            [id, did],
          )
        }
      }
      if (stage === "visa" && (body.visa_file_no !== undefined || body.visa_embassy !== undefined || body.document_url !== undefined)) {
        const up = await query(
          `INSERT INTO visa_details (workflow_stage_id, visa_file_no, visa_embassy, document_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (workflow_stage_id) DO UPDATE SET
             visa_file_no = EXCLUDED.visa_file_no,
             visa_embassy = EXCLUDED.visa_embassy,
             document_url = COALESCE(EXCLUDED.document_url, visa_details.document_url),
             updated_at = now()
           RETURNING id`,
          [id, body.visa_file_no ?? null, body.visa_embassy ?? null, body.document_url ?? null],
        )
        const did = up.rows?.[0]?.id
        if (did) {
          await query(
            `INSERT INTO workflow_stage_results (workflow_stage_id, stage_key, detail_id)
             VALUES ($1, 'visa', $2)
             ON CONFLICT (workflow_stage_id, stage_key) DO UPDATE SET detail_id = EXCLUDED.detail_id`,
            [id, did],
          )
        }
      }
      if (stage === "protector" && (body.protector_no !== undefined || body.document_url !== undefined)) {
        const up = await query(
          `INSERT INTO protector_details (workflow_stage_id, protector_no, document_url)
           VALUES ($1, $2, $3)
           ON CONFLICT (workflow_stage_id) DO UPDATE SET
             protector_no = EXCLUDED.protector_no,
             document_url = COALESCE(EXCLUDED.document_url, protector_details.document_url),
             updated_at = now()
           RETURNING id`,
          [id, body.protector_no ?? null, body.document_url ?? null],
        )
        const did = up.rows?.[0]?.id
        if (did) {
          await query(
            `INSERT INTO workflow_stage_results (workflow_stage_id, stage_key, detail_id)
             VALUES ($1, 'protector', $2)
             ON CONFLICT (workflow_stage_id, stage_key) DO UPDATE SET detail_id = EXCLUDED.detail_id`,
            [id, did],
          )
        }
      }
      if (stage === "flight" && (body.flight_pnr !== undefined || body.flight_airline !== undefined || body.document_url !== undefined)) {
        const up = await query(
          `INSERT INTO flight_details (workflow_stage_id, flight_pnr, flight_airline, document_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (workflow_stage_id) DO UPDATE SET
             flight_pnr = EXCLUDED.flight_pnr,
             flight_airline = EXCLUDED.flight_airline,
             document_url = COALESCE(EXCLUDED.document_url, flight_details.document_url),
             updated_at = now()
           RETURNING id`,
          [id, body.flight_pnr ?? null, body.flight_airline ?? null, body.document_url ?? null],
        )
        const did = up.rows?.[0]?.id
        if (did) {
          await query(
            `INSERT INTO workflow_stage_results (workflow_stage_id, stage_key, detail_id)
             VALUES ($1, 'flight', $2)
             ON CONFLICT (workflow_stage_id, stage_key) DO UPDATE SET detail_id = EXCLUDED.detail_id`,
            [id, did],
          )
        }
      }
    } catch (e) {
      logger.warn("Stage detail upsert failed", { id, stage, error: (e as any)?.message })
    }

    // Attach multiple document URLs if provided
    try {
      if (Array.isArray(body.documents) && body.documents.length && (await (async () => await query(`SELECT to_regclass($1) as oid`, ["public.stage_documents"]))()).rows?.[0]?.oid) {
        for (const d of body.documents) {
          if (!d?.url) continue
          await query(
            `INSERT INTO stage_documents (workflow_stage_id, stage_key, url, filename, mime_type, size_bytes, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, stage, d.url, d.filename ?? null, d.mime_type ?? null, d.size_bytes ?? null, auth.payload.userId],
          )
        }
      }
    } catch (e) {
      logger.warn("Stage documents insert failed", { id, stage, error: (e as any)?.message })
    }

    // Log the action
    const ctx = { workflowId: id, stage, status, userId: auth.payload.userId }
    try {
      await query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          auth.payload.userId,
          "workflow_update",
          "workflow_stages",
          id,
          JSON.stringify({ stage, status, action }),
        ],
      )
    } catch (e) {
      logger.warn("Audit log insert failed", { ...ctx, error: (e as any)?.message })
    }

    return NextResponse.json({
      success: true,
      message: "Workflow updated successfully",
    })
  } catch (error) {
    console.error("Update workflow error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
