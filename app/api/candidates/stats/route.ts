import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getToken } from "next-auth/jwt"

const secret = process.env.NEXTAUTH_SECRET || "mint-international-secret-key-2024"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret })

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get various statistics
    const [totalResult, todayResult, monthResult, statusResult, recentResult] = await Promise.all([
      query("SELECT COUNT(*) as total FROM candidates"),

      query(`SELECT COUNT(*) as today FROM candidates WHERE DATE(created_at) = CURRENT_DATE`),

      query(`
        SELECT COUNT(*) as month
        FROM candidates
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      `),

      query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM candidates 
        GROUP BY status
      `),

      query(`
        SELECT 
          id, full_name, surname, post_applied_for, status, created_at
        FROM candidates 
        ORDER BY created_at DESC 
        LIMIT 8
      `),
    ])

    const statusBreakdown = statusResult.rows.reduce(
      (acc: Record<string, number>, row: { status: string; count: string }) => {
        acc[row.status] = Number.parseInt(row.count)
        return acc
      },
      {},
    )

    const stats = {
      total: Number.parseInt(totalResult.rows[0].total),
      today: Number.parseInt(todayResult.rows[0].today),
      thisMonth: Number.parseInt(monthResult.rows[0].month),
      statusBreakdown,
      active: statusBreakdown.active ?? 0,
      inProcess: statusBreakdown.in_process ?? 0,
      completed: statusBreakdown.completed ?? 0,
      rejected: statusBreakdown.rejected ?? 0,
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
