import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getToken } from "next-auth/jwt"
import { computeExperienceTotal } from "@/lib/candidate-experience"

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

    const technicalQualResult = await query(
      `SELECT * FROM technical_qualification_details WHERE candidate_id = $1 ORDER BY created_at`,
      [id],
    )

    const certificatesResult = await query(
      `SELECT * FROM candidate_certificates WHERE candidate_id = $1 ORDER BY created_at`,
      [id],
    )

    const candidate = {
      ...candidateResult.rows[0],
      experience_details: experienceResult.rows,
      technical_qualification_details: technicalQualResult.rows,
      certificate_attachments: certificatesResult.rows,
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
      surname,
      father_name,
      date_of_birth,
      marital_status,
      religion,
      sex,
      citizenship_no,
      passport_no,
      date_of_issue,
      date_of_expiry,
      place_of_issue,
      primary_school,
      secondary_school,
      higher_education,
      diploma,
      academic_qualifications,
      technical_qualifications,
      languages_known,
      gcc_experience,
      ksa_experience,
      local_experience,
      post_applied_for,
      referred_by,
      cnic_front_image,
      cnic_back_image,
      matric_certificate,
      intermediate_certificate,
      diploma_certificate,
      passport_image,
      experience_letter,
      profile_image,
      cv_file,
      remarks,
      status,
      experience_details,
      technical_qualification_details,
    } = data

    const experience_total = computeExperienceTotal(gcc_experience, ksa_experience, local_experience)

    // Update candidate
    await query(
      `UPDATE candidates SET
        full_name = $1, surname = $2, father_name = $3, date_of_birth = $4, marital_status = $5,
        religion = $6, sex = $7, citizenship_no = $8, passport_no = $9, date_of_issue = $10, date_of_expiry = $11,
        place_of_issue = $12, cnic_front_image = $13, cnic_back_image = $14,
        primary_school = $15, secondary_school = $16, higher_education = $17, diploma = $18,
        matric_certificate = $19, intermediate_certificate = $20, diploma_certificate = $21, passport_image = $22,
        academic_qualifications = $23, technical_qualifications = $24,
        languages_known = $25, gcc_experience = $26, ksa_experience = $27, local_experience = $28,
        experience_total = $29, post_applied_for = $30,
        referred_by = $31, experience_letter = $32, profile_image = $33, cv_file = $34, remarks = $35,
        status = $36, updated_at = CURRENT_TIMESTAMP
      WHERE id = $37`,
      [
        full_name,
        surname,
        father_name,
        date_of_birth,
        marital_status,
        religion,
        sex,
        citizenship_no,
        passport_no,
        date_of_issue,
        date_of_expiry,
        place_of_issue,
        cnic_front_image,
        cnic_back_image,
        primary_school,
        secondary_school,
        higher_education,
        diploma,
        matric_certificate,
        intermediate_certificate ?? null,
        diploma_certificate ?? null,
        passport_image,
        academic_qualifications,
        technical_qualifications,
        languages_known,
        gcc_experience,
        ksa_experience,
        local_experience,
        experience_total,
        post_applied_for,
        referred_by,
        experience_letter,
        profile_image,
        cv_file,
        remarks,
        status,
        id,
      ],
    )

    // Update experience details
    if (experience_details) {
      await query("DELETE FROM experience_details WHERE candidate_id = $1", [id])
      for (const exp of experience_details) {
        await query(
          `INSERT INTO experience_details (candidate_id, company_name, duration, trade)
           VALUES ($1, $2, $3, $4)`,
          [id, exp.company_name, exp.duration, exp.trade],
        )
      }
    }

    // Update technical qualification details
    if (technical_qualification_details) {
      await query("DELETE FROM technical_qualification_details WHERE candidate_id = $1", [id])
      for (const tq of technical_qualification_details) {
        if (!tq.qualification_name?.trim()) continue
        await query(
          `INSERT INTO technical_qualification_details (candidate_id, qualification_name, institution, year, certificate_file)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, tq.qualification_name, tq.institution || null, tq.year || null, tq.certificate_file || null],
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

