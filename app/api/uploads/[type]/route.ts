import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { saveFile } from "@/lib/uploads"

export const runtime = "nodejs"

export async function POST(request: NextRequest, context: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await context.params
    const auth = await requireAuth(request, ["super_admin", "admin", "receptionist", "process_agent", "accountant"])
    if (!auth.ok) return auth.response

    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ success: false, message: "Content-Type must be multipart/form-data" }, { status: 400 })
    }

    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "File is required (field name 'file')" }, { status: 400 })
    }

    // Basic size/type guard (adjust as needed)
    const maxBytes = 10 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ success: false, message: "File too large (max 10MB)" }, { status: 413 })
    }

    const result = await saveFile(type, file)
    return NextResponse.json({ success: true, url: result.url, filename: result.filename })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}


