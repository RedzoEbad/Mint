import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/api-auth"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request, ["super_admin", "admin"])
    if (!auth.ok) return auth.response
    const { id } = await context.params

    const { name, contact_person, email, phone, address, country, requirements } = await request.json()

    const updates: string[] = []
    const params: any[] = []
    let p = 0
    if (name !== undefined) { p++; updates.push(`name = $${p}`); params.push(name) }
    if (contact_person !== undefined) { p++; updates.push(`contact_person = $${p}`); params.push(contact_person) }
    if (email !== undefined) { p++; updates.push(`email = $${p}`); params.push(email) }
    if (phone !== undefined) { p++; updates.push(`phone = $${p}`); params.push(phone) }
    if (address !== undefined) { p++; updates.push(`address = $${p}`); params.push(address) }
    if (country !== undefined) { p++; updates.push(`country = $${p}`); params.push(country) }
    if (requirements !== undefined) { p++; updates.push(`requirements = $${p}`); params.push(requirements) }

    if (updates.length === 0) return NextResponse.json({ success: false, message: "No fields to update" }, { status: 400 })

    p++; params.push(id)
    const sql = `UPDATE companies SET ${updates.join(", ")}, updated_at = now() WHERE id = $${p}`
    await query(sql, params)

    return NextResponse.json({ success: true, message: "Company updated" })
  } catch (error) {
    console.error("Update company error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


