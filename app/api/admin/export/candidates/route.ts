import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const user = await verifyToken(token)

    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { candidateIds, format = "json" } = await request.json()

    if (!candidateIds || candidateIds.length === 0) {
      return NextResponse.json({ error: "No candidates selected" }, { status: 400 })
    }

    // Get candidate data with related information
    const candidates = await query(
      `
      SELECT 
        c.*,
        w.medical_status,
        w.visa_status,
        w.protector_status,
        w.passport_status,
        w.flight_status,
        COUNT(p.id) as total_payments,
        SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid
      FROM candidates c
      LEFT JOIN workflows w ON c.id = w.candidate_id
      LEFT JOIN payments p ON c.id = p.candidate_id
      WHERE c.id = ANY($1)
      GROUP BY c.id, w.medical_status, w.visa_status, w.protector_status, w.passport_status, w.flight_status
      ORDER BY c.created_at DESC
    `,
      [candidateIds],
    )

    if (format === "csv") {
      // Generate CSV format
      const headers = [
        "ID",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Nationality",
        "Status",
        "Medical Status",
        "Visa Status",
        "Protector Status",
        "Passport Status",
        "Flight Status",
        "Total Payments",
        "Total Paid",
        "Created At",
      ]

      const csvRows = [
        headers.join(","),
        ...candidates.rows.map((candidate) =>
          [
            candidate.id,
            candidate.first_name,
            candidate.last_name,
            candidate.email,
            candidate.phone,
            candidate.nationality,
            candidate.status,
            candidate.medical_status || "not_started",
            candidate.visa_status || "not_started",
            candidate.protector_status || "not_started",
            candidate.passport_status || "not_started",
            candidate.flight_status || "not_started",
            candidate.total_payments || 0,
            candidate.total_paid || 0,
            candidate.created_at,
          ]
            .map((field) => `"${field}"`)
            .join(","),
        ),
      ]

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="candidates-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // Return JSON format
    return NextResponse.json({
      candidates: candidates.rows,
      exportedAt: new Date().toISOString(),
      exportedBy: user.full_name || user.email,
    })
  } catch (error) {
    console.error("Export candidates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
