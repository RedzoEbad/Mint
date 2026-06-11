import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"
import { saveFile } from "@/lib/uploads"
import { computeExperienceTotal } from "@/lib/candidate-experience"

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
    let cnicFrontUrl: string | null = null
    let cnicBackUrl: string | null = null
    let matricCertificateUrl: string | null = null
    let diplomaCertificateUrl: string | null = null
    let passportImageUrl: string | null = null
    let experienceLetterUrl: string | null = null

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      // Strings
      payload.full_name = String(form.get("full_name") || "").trim()
      payload.surname = String(form.get("surname") || "").trim()
      payload.father_name = String(form.get("father_name") || "").trim()
      payload.date_of_birth = String(form.get("date_of_birth") || "") || null
      payload.marital_status = String(form.get("marital_status") || "").trim()
      payload.religion = String(form.get("religion") || "").trim()
      payload.sex = String(form.get("sex") || "").trim()
      payload.citizenship_no = String(form.get("citizenship_no") || "").trim()
      payload.passport_no = String(form.get("passport_no") || "").trim()
      payload.date_of_issue = String(form.get("date_of_issue") || "") || null
      payload.date_of_expiry = String(form.get("date_of_expiry") || "") || null
      payload.place_of_issue = String(form.get("place_of_issue") || "").trim()
      payload.primary_school = String(form.get("primary_school") || "").trim()
      payload.secondary_school = String(form.get("secondary_school") || "").trim()
      payload.higher_education = String(form.get("higher_education") || "").trim()
      payload.diploma = String(form.get("diploma") || "").trim()
      payload.academic_qualifications = String(form.get("academic_qualifications") || "")
      payload.technical_qualifications = String(form.get("technical_qualifications") || "")
      payload.gcc_experience = String(form.get("gcc_experience") || "").trim()
      payload.ksa_experience = String(form.get("ksa_experience") || "").trim()
      payload.local_experience = String(form.get("local_experience") || "").trim()
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

      const techQualRaw = form.get("technical_qualification_details")
      if (typeof techQualRaw === "string") {
        try {
          const arr = JSON.parse(techQualRaw)
          payload.technical_qualification_details = Array.isArray(arr) ? arr : []
        } catch {
          payload.technical_qualification_details = []
        }
      } else {
        payload.technical_qualification_details = []
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
      const cnicFront = form.get("cnic_front_file")
      if (cnicFront instanceof File && cnicFront.size > 0) {
        cnicFrontUrl = (await saveFile("cnic-images", cnicFront)).url
      }
      const cnicBack = form.get("cnic_back_file")
      if (cnicBack instanceof File && cnicBack.size > 0) {
        cnicBackUrl = (await saveFile("cnic-images", cnicBack)).url
      }
      const passportImage = form.get("passport_image_file")
      if (passportImage instanceof File && passportImage.size > 0) {
        passportImageUrl = (await saveFile("passport-images", passportImage)).url
      }
      const educationalDoc = form.get("educational_document_file")
      if (educationalDoc instanceof File && educationalDoc.size > 0) {
        matricCertificateUrl = (await saveFile("certificates", educationalDoc)).url
      }
      const diplomaCert = form.get("diploma_certificate_file")
      if (diplomaCert instanceof File && diplomaCert.size > 0) {
        diplomaCertificateUrl = (await saveFile("certificates", diplomaCert)).url
      }
      const experienceLetter = form.get("experience_letter_file")
      if (experienceLetter instanceof File && experienceLetter.size > 0) {
        experienceLetterUrl = (await saveFile("experience-letters", experienceLetter)).url
      }

      // Technical qualification certificate files (indexed: technical_qual_cert_0, etc.)
      for (let i = 0; i < payload.technical_qualification_details.length; i++) {
        const certFile = form.get(`technical_qual_cert_${i}`)
        if (certFile instanceof File && certFile.size > 0) {
          payload.technical_qualification_details[i].certificate_file = (await saveFile("certificates", certFile)).url
        }
      }
    } else {
      // JSON body fallback
      const data = await request.json()
      payload = data
      profileImageUrl = data.profile_image || null
      cvFileUrl = data.cv_file || null
      cnicFrontUrl = data.cnic_front_image || null
      cnicBackUrl = data.cnic_back_image || null
      matricCertificateUrl = data.matric_certificate || data.educational_document || null
      diplomaCertificateUrl = data.diploma_certificate || null
      passportImageUrl = data.passport_image || null
      experienceLetterUrl = data.experience_letter || null
    }

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
      remarks,
      experience_details,
      technical_qualification_details,
    } = payload

    const experience_total = computeExperienceTotal(gcc_experience, ksa_experience, local_experience)

    // Insert candidate
    const candidateResult = await query(
      `INSERT INTO candidates (
        full_name, surname, father_name, date_of_birth, marital_status, religion, sex, citizenship_no,
        passport_no, date_of_issue, date_of_expiry, place_of_issue, cnic_front_image, cnic_back_image,
        primary_school, secondary_school, higher_education, diploma,
        matric_certificate, intermediate_certificate, diploma_certificate, passport_image,
        academic_qualifications, technical_qualifications, languages_known,
        gcc_experience, ksa_experience, local_experience, experience_total,
        post_applied_for, referred_by, experience_letter, profile_image,
        cv_file, remarks, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
      RETURNING id`,
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
        cnicFrontUrl,
        cnicBackUrl,
        primary_school,
        secondary_school,
        higher_education,
        diploma,
        matricCertificateUrl,
        null,
        diplomaCertificateUrl,
        passportImageUrl,
        academic_qualifications,
        technical_qualifications,
        languages_known,
        gcc_experience,
        ksa_experience,
        local_experience,
        experience_total,
        post_applied_for,
        referred_by,
        experienceLetterUrl,
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

    // Insert technical qualification details
    if (technical_qualification_details && technical_qualification_details.length > 0) {
      for (const tq of technical_qualification_details) {
        if (!tq.qualification_name?.trim()) continue
        await query(
          `INSERT INTO technical_qualification_details (candidate_id, qualification_name, institution, year, certificate_file)
           VALUES ($1, $2, $3, $4, $5)`,
          [candidateId, tq.qualification_name, tq.institution || null, tq.year || null, tq.certificate_file || null],
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
