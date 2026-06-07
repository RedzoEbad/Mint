import { type NextRequest, NextResponse } from "next/server"
import { getAuthToken } from "@/lib/get-auth-token"
import { isS3StorageEnabled } from "@/lib/s3-storage"
import { readStoredFile } from "@/lib/uploads"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
    const token = await getAuthToken(request)
    const allowed = ["super_admin", "receptionist", "process_agent", "admin", "accountant"]
    if (!token || !allowed.includes(token.role as string)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { path: segments } = await context.params
    if (!segments?.length || segments.length < 2) {
      return NextResponse.json({ success: false, message: "Invalid file path" }, { status: 400 })
    }

    const fileUrl = `/api/files/${segments.join("/")}`
    const file = await readStoredFile(fileUrl)
    if (!file) {
      const onVercel = Boolean(process.env.VERCEL)
      const message =
        onVercel && !isS3StorageEnabled()
          ? "File storage not configured. Add AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY to Vercel environment variables, then redeploy."
          : "File not found"
      return NextResponse.json({ success: false, message }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.contentType || "application/octet-stream",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("File serve error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
