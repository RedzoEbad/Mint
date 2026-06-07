import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getToken } from "next-auth/jwt"
import { getJwtTokenOptions } from "@/lib/auth-env"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken(getJwtTokenOptions(request))

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get various statistics
    const [totalResult, todayResult, statusResult, recentResult] = await Promise.all([
      // Total candidates
      query("SELECT COUNT(*) as total FROM candidates"),

      // Today's candidates
      query(`SELECT COUNT(*) as today FROM candidates WHERE DATE(created_at) = CURRENT_DATE`),

      // Status breakdown
      query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM candidates 
        GROUP BY status
      `),

      // Recent candidates
      query(`
        SELECT 
          id, full_name, post_applied_for, status, created_at
        FROM candidates 
        ORDER BY created_at DESC 
        LIMIT 5
      `),
    ])

    const stats = {
      total: Number.parseInt(totalResult.rows[0].total),
      today: Number.parseInt(todayResult.rows[0].today),
      statusBreakdown: statusResult.rows.reduce((acc, row) => {
        acc[row.status] = Number.parseInt(row.count)
        return acc
      }, {}),
      recent: recentResult.rows,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Get candidate stats error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
