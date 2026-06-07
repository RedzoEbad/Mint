import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { query } from "@/lib/database"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const secret = process.env.NEXTAUTH_SECRET || "mint-international-secret-key-2024"

function csvEscape(value: unknown): string {
  const str = value == null ? "" : String(value)
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(cells: unknown[]): string {
  return cells.map(csvEscape).join(",")
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const token = await getToken({ req: request, secret })
    const allowed = ["super_admin", "receptionist"]
    if (!token || !allowed.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const candidateResult = await query(`SELECT * FROM candidates WHERE id = $1`, [id])
    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const c = candidateResult.rows[0]

    const techQualResult = await query(
      `SELECT qualification_name, institution, year FROM technical_qualification_details WHERE candidate_id = $1 ORDER BY created_at`,
      [id],
    )

    const techSummary = techQualResult.rows
      .map((tq: any) => `${tq.qualification_name} (${tq.institution || "—"}, ${tq.year || "—"})`)
      .join("; ")

    const lines = [
      row(["Field", "Value"]),
      row(["Full Name", c.full_name]),
      row(["Surname", c.surname]),
      row(["Father Name", c.father_name]),
      row(["Date of Birth", c.date_of_birth]),
      row(["Marital Status", c.marital_status]),
      row(["Religion", c.religion]),
      row(["Sex", c.sex]),
      row(["Citizenship No", c.citizenship_no]),
      row(["Passport No", c.passport_no]),
      row(["Date of Issue", c.date_of_issue]),
      row(["Date of Expiry", c.date_of_expiry]),
      row(["Place of Issue", c.place_of_issue]),
      row(["Primary School", c.primary_school]),
      row(["Secondary School", c.secondary_school]),
      row(["Higher Education", c.higher_education]),
      row(["Diploma", c.diploma]),
      row(["Languages Known", Array.isArray(c.languages_known) ? c.languages_known.join(", ") : ""]),
      row(["Technical Qualifications", techSummary]),
      row(["Post Applied For", c.post_applied_for]),
      row(["Referred By", c.referred_by]),
      row(["GCC Experience (years)", c.gcc_experience]),
      row(["KSA Experience (years)", c.ksa_experience]),
      row(["Local Experience (years)", c.local_experience]),
      row(["Total Experience (years)", c.experience_total]),
      row(["Remarks", c.remarks]),
      row(["Status", c.status]),
      row(["Created At", c.created_at]),
    ]

    const csv = "\uFEFF" + lines.join("\n")
    const filename = `candidate-${c.passport_no || id}.csv`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Excel export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
