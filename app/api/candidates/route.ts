import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !["super_admin", "receptionist", "process_agent"].includes(payload.role)) {
      return NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 })
    }

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
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !["super_admin", "receptionist"].includes(payload.role)) {
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
      experience_details,
    } = data

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
        profile_image,
        cv_file,
        remarks,
        payload.userId,
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
