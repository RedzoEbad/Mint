import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { agentCompanyAssignments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request as any, ["super_admin", "admin"]) as any
  if (!auth.ok) return auth.response
  const id = params.id
  if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 })
  await db.delete(agentCompanyAssignments).where(eq(agentCompanyAssignments.id, id))
  return NextResponse.json({ success: true })
}


