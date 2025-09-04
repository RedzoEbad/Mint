import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !["super_admin", "process_agent"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 })
    }

    const data = await request.json()
    const { medical_status, visa_status, protector_status, passport_status, flight_status, overall_status } = data

    await query(
      `UPDATE workflow_stages SET
        medical_status = COALESCE($1, medical_status),
        visa_status = COALESCE($2, visa_status),
        protector_status = COALESCE($3, protector_status),
        passport_status = COALESCE($4, passport_status),
        flight_status = COALESCE($5, flight_status),
        overall_status = COALESCE($6, overall_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7`,
      [medical_status, visa_status, protector_status, passport_status, flight_status, overall_status, params.id],
    )

    return NextResponse.json({
      success: true,
      message: "Workflow updated successfully",
    })
  } catch (error) {
    console.error("Update workflow error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
