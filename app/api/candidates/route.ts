import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"
import { saveFile } from "@/lib/uploads"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "receptionist", "process_agent", "admin"])
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      whereClause += ` AND (full_name ILIKE $${paramCount} OR passport_no ILIKE $${paramCount} OR post_applied_for ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    if (status) {
      paramCount++
      whereClause += ` AND status = $${paramCount}`
      params.push(status)
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM candidates ${whereClause}`, params)
    const total = Number.parseInt(countResult.rows[0].count)

    // Get candidates with pagination
    const candidatesResult = await query(
      `SELECT 
        c.*,
        u.full_name as created_by_name,
        (SELECT COUNT(*) FROM experience_details WHERE candidate_id = c.id) as experience_count
      FROM candidates c
      LEFT JOIN users u ON c.created_by = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset],
    )

    return NextResponse.json({
      success: true,
      data: candidatesResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get candidates error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["super_admin", "receptionist"])
    if (!auth.ok) return auth.response

    const contentType = request.headers.get("content-type") || ""
    let payload: any = {}
    let profileImageUrl: string | null = null
    let cvFileUrl: string | null = null

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      // Strings
      payload.full_name = String(form.get("full_name") || "").trim()
      payload.father_name = String(form.get("father_name") || "").trim()
      payload.date_of_birth = String(form.get("date_of_birth") || "") || null
      payload.marital_status = String(form.get("marital_status") || "").trim()
      payload.religion = String(form.get("religion") || "").trim()
      payload.passport_no = String(form.get("passport_no") || "").trim()
      payload.date_of_issue = String(form.get("date_of_issue") || "") || null
      payload.date_of_expiry = String(form.get("date_of_expiry") || "") || null
      payload.place_of_issue = String(form.get("place_of_issue") || "").trim()
      payload.academic_qualifications = String(form.get("academic_qualifications") || "")
      payload.technical_qualifications = String(form.get("technical_qualifications") || "")
      payload.experience_total = String(form.get("experience_total") || "").trim()
      payload.post_applied_for = String(form.get("post_applied_for") || "").trim()
      payload.referred_by = String(form.get("referred_by") || "").trim()
      payload.remarks = String(form.get("remarks") || "")

      // Arrays / JSON-ish
      const langsRaw = form.get("languages_known")
      if (typeof langsRaw === "string") {
        try {
          const arr = JSON.parse(langsRaw)
          payload.languages_known = Array.isArray(arr) ? arr : []
        } catch {
          payload.languages_known = []
        }
      } else {
        payload.languages_known = []
      }

      const expRaw = form.get("experience_details")
      if (typeof expRaw === "string") {
        try {
          const arr = JSON.parse(expRaw)
          payload.experience_details = Array.isArray(arr) ? arr : []
        } catch {
          payload.experience_details = []
        }
      } else {
        payload.experience_details = []
      }

      // Files
      const profileImage = form.get("profile_image_file")
      if (profileImage instanceof File && profileImage.size > 0) {
        profileImageUrl = (await saveFile("profile-images", profileImage)).url
      }
      const cvDoc = form.get("cv_file")
      if (cvDoc instanceof File && cvDoc.size > 0) {
        cvFileUrl = (await saveFile("cv-docs", cvDoc)).url
      }
    } else {
      // JSON body fallback
      const data = await request.json()
      payload = data
      profileImageUrl = data.profile_image || null
      cvFileUrl = data.cv_file || null
    }

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
      remarks,
      experience_details,
    } = payload

    // Insert candidate
    const candidateResult = await query(
      `INSERT INTO candidates (
        full_name, father_name, date_of_birth, marital_status, religion,
        passport_no, date_of_issue, date_of_expiry, place_of_issue,
        academic_qualifications, technical_qualifications, languages_known,
        experience_total, post_applied_for, referred_by, profile_image,
        cv_file, remarks, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id`,
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
        profileImageUrl,
        cvFileUrl,
        remarks,
        auth.payload.userId,
      ],
    )

    const candidateId = candidateResult.rows[0].id

    // Insert experience details if provided
    if (experience_details && experience_details.length > 0) {
      for (const exp of experience_details) {
        await query(
          `INSERT INTO experience_details (candidate_id, company_name, duration, trade)
           VALUES ($1, $2, $3, $4)`,
          [candidateId, exp.company_name, exp.duration, exp.trade],
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Candidate created successfully",
      candidateId,
    })
  } catch (error) {
    console.error("Create candidate error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
