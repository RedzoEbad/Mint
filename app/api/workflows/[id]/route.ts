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
      `SELECT w.*, c.full_name as candidate_name, comp.name as company_name, u.full_name as agent_name
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

    return NextResponse.json({ success: true, data: wf.rows[0] })
  } catch (e) {
    console.error("Get workflow error:", e)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// Update workflow stage statuses
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request, ["super_admin", "process_agent", "admin"])
    if (!auth.ok) return auth.response
    const { id } = await context.params

    const body = await request.json()
    const action: string | undefined = body.action
    let stage: string | undefined = body.stage
    let status: string | undefined = body.status

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

    // If retracting to a previous stage, reset subsequent stages and their payment statuses
    if (status === "pending" && currentStage[`${stage}_status`] === "completed") {
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

    // Update the specific stage
    await query(
      `UPDATE workflow_stages SET
        ${stage}_status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
      [status, id],
    )

    // Log the action
    const ctx = { workflowId: id, stage, status, userId: auth.payload.userId }
    try {
      await query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
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
