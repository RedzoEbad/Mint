import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { getToken } from "next-auth/jwt"
import { resolveStoredFilePath } from "@/lib/uploads"

export const runtime = "nodejs"

const secret = process.env.NEXTAUTH_SECRET || "mint-international-secret-key-2024"

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const token = await getToken({ req: request, secret })
    const allowed = ["super_admin", "receptionist", "process_agent", "admin", "accountant"]
    if (!token || !allowed.includes(token.role as string)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { path: segments } = await context.params
    if (!segments?.length || segments.length < 2) {
      return NextResponse.json({ success: false, message: "Invalid file path" }, { status: 400 })
    }

    const fileUrl = `/api/files/${segments.join("/")}`
    const filepath = await resolveStoredFilePath(fileUrl)
    if (!filepath) {
      return NextResponse.json({ success: false, message: "File not found" }, { status: 404 })
    }

    const buffer = await fs.readFile(filepath)
    const ext = path.extname(filepath).toLowerCase()
    const contentType = MIME[ext] || "application/octet-stream"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("File serve error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
