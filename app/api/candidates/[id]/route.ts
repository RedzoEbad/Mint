import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getToken } from "next-auth/jwt"

const secret = process.env.NEXTAUTH_SECRET || "mint-international-secret-key-2024"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const token = await getToken({ req: request, secret })

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const candidateResult = await query(
      `SELECT 
        c.*,
        u.full_name as created_by_name
      FROM candidates c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1`,
      [id],
    )

    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Candidate not found" }, { status: 404 })
    }

    // Get experience details
    const experienceResult = await query(
      `SELECT * FROM experience_details WHERE candidate_id = $1 ORDER BY created_at`,
      [id],
    )

    const candidate = {
      ...candidateResult.rows[0],
      experience_details: experienceResult.rows,
    }

    return NextResponse.json({
      success: true,
      data: candidate,
    })
  } catch (error) {
    console.error("Get candidate error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const token = await getToken({ req: request, secret })

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (!["super_admin", "receptionist"].includes(token.role as string)) {
      return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 })
    }

    const data = await request.json()
    const {
      full_name,
      father_name,
      date_of_birth,
      marital_status,
      religion,
      passport_no,
      date_of_issue,
      date_of_expiry,
      place_of_issue,
      academic_qualifications,
      technical_qualifications,
      languages_known,
      experience_total,
      post_applied_for,
      referred_by,
      profile_image,
      cv_file,
      remarks,
      status,
      experience_details,
    } = data

    // Update candidate
    await query(
      `UPDATE candidates SET
        full_name = $1, father_name = $2, date_of_birth = $3, marital_status = $4,
        religion = $5, passport_no = $6, date_of_issue = $7, date_of_expiry = $8,
        place_of_issue = $9, academic_qualifications = $10, technical_qualifications = $11,
        languages_known = $12, experience_total = $13, post_applied_for = $14,
        referred_by = $15, profile_image = $16, cv_file = $17, remarks = $18,
        status = $19, updated_at = CURRENT_TIMESTAMP
      WHERE id = $20`,
      [
        full_name,
        father_name,
        date_of_birth,
        marital_status,
        religion,
        passport_no,
        date_of_issue,
        date_of_expiry,
        place_of_issue,
        academic_qualifications,
        technical_qualifications,
        languages_known,
        experience_total,
        post_applied_for,
        referred_by,
        profile_image,
        cv_file,
        remarks,
        status,
        id,
      ],
    )

    // Update experience details
    if (experience_details) {
      // Delete existing experience details
      await query("DELETE FROM experience_details WHERE candidate_id = $1", [id])

      // Insert new experience details
      for (const exp of experience_details) {
        await query(
          `INSERT INTO experience_details (candidate_id, company_name, duration, trade)
           VALUES ($1, $2, $3, $4)`,
          [id, exp.company_name, exp.duration, exp.trade],
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Candidate updated successfully",
    })
  } catch (error) {
    console.error("Update candidate error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const token = await getToken({ req: request, secret })

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (!["super_admin", "receptionist"].includes(token.role as string)) {
      return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 })
    }

    await query("DELETE FROM candidates WHERE id = $1", [id])

    return NextResponse.json({
      success: true,
      message: "Candidate deleted successfully",
    })
  } catch (error) {
    console.error("Delete candidate error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

