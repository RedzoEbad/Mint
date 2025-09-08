import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { query } from "@/lib/database"
import { withTiming, timedQuery } from "@/lib/performance"

export const GET = withTiming(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request, ["super_admin", "admin"])
    if (!auth.ok) return auth.response

    // Get comprehensive system statistics with timing
    const [userStats, candidateStats, companyStats, workflowStats, paymentStats, recentActivity] = await Promise.all([
      // User statistics
      timedQuery(() => query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'receptionist' THEN 1 END) as receptionists,
          COUNT(CASE WHEN role = 'process_agent' THEN 1 END) as process_agents,
          COUNT(CASE WHEN role = 'accountant' THEN 1 END) as accountants,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
        FROM users
      `), "User Stats Query"),

      // Candidate statistics
      timedQuery(() => query(`
        SELECT 
          COUNT(*) as total_candidates,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_candidates,
          COUNT(CASE WHEN status = 'in_process' THEN 1 END) as in_process,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
        FROM candidates
      `), "Candidate Stats Query"),

      // Company statistics
      timedQuery(() => query(`
        SELECT 
          COUNT(*) as total_companies,
          COUNT(*) as active_companies
        FROM companies
      `), "Company Stats Query"),

      // Workflow statistics
      timedQuery(() => query(`
        SELECT 
          COUNT(*) as total_workflows,
          COUNT(CASE WHEN medical_status = 'completed' THEN 1 END) as medical_completed,
          COUNT(CASE WHEN visa_status = 'completed' THEN 1 END) as visa_completed,
          COUNT(CASE WHEN protector_status = 'completed' THEN 1 END) as protector_completed,
          COUNT(CASE WHEN passport_status = 'completed' THEN 1 END) as passport_completed,
          COUNT(CASE WHEN flight_status = 'completed' THEN 1 END) as flight_completed
        FROM workflow_stages
      `), "Workflow Stats Query"),

      // Payment statistics
      timedQuery(() => query(`
        SELECT 
          COUNT(*) as total_payments,
          SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) as total_revenue,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
          AVG(CASE WHEN payment_status = 'paid' THEN amount ELSE NULL END) as avg_payment
        FROM payments
      `), "Payment Stats Query"),

      // Recent activity
      timedQuery(() => query(`
        SELECT 
          'candidate' as type,
          c.full_name as description,
          c.created_at as timestamp
        FROM candidates c
        WHERE c.created_at >= NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT 
          'payment' as type,
          'Payment of $' || p.amount || ' for ' || p.payment_type as description,
          p.created_at as timestamp
        FROM payments p
        WHERE p.created_at >= NOW() - INTERVAL '7 days'
        ORDER BY timestamp DESC
        LIMIT 10
      `), "Recent Activity Query"),
    ])

    return NextResponse.json({
      users: userStats.rows[0],
      candidates: candidateStats.rows[0],
      companies: companyStats.rows[0],
      workflows: workflowStats.rows[0],
      payments: paymentStats.rows[0],
      recentActivity: recentActivity.rows,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}, "Admin Stats API")
