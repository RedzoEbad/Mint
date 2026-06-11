import { promises as fs } from "fs"
import path from "path"
import { NextResponse, type NextRequest } from "next/server"
import { generateCandidatePdf } from "@/lib/candidate-pdf"
import { getCandidateById } from "@/lib/get-candidate"
import { getAuthToken } from "@/lib/get-auth-token"
import { logger, getRequestContext } from "@/lib/logger"
import { readStoredFile } from "@/lib/uploads"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request)
  const { id: candidateId } = await context.params
  if (!candidateId) {
    logger.warn("PDF: missing candidate id", ctx)
    return NextResponse.json({ error: "Missing candidate id" }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const typeParam = searchParams.get("type") || "own"
  const type = typeParam === "client" ? "client" : "own"

  try {
    const token = await getAuthToken(request)
    const allowed = ["super_admin", "receptionist"]
    if (!token || !allowed.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const candidate = await getCandidateById(candidateId)
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    let logoBuffer: Buffer | null = null
    let headerImageBuffer: Buffer | null = null
    try {
      logoBuffer = await fs.readFile(path.join(process.cwd(), "public", "images", "mint-logo.png"))
    } catch {
      logger.warn("PDF: logo not found", ctx)
    }
    try {
      headerImageBuffer = await fs.readFile(path.join(process.cwd(), "public", "images", "mint-form-header.png"))
    } catch {
      try {
        headerImageBuffer = await fs.readFile(path.join(process.cwd(), "public", "images", "mint-form-reference.png"))
      } catch {
        logger.warn("PDF: form header image not found", ctx)
      }
    }

    let profileImageBuffer: Buffer | null = null
    if (candidate.profile_image) {
      const profileFile = await readStoredFile(candidate.profile_image)
      profileImageBuffer = profileFile?.buffer ?? null
    }

    const pdfBuffer = await generateCandidatePdf({
      candidate,
      type,
      logoBuffer,
      headerImageBuffer,
      profileImageBuffer,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=candidate-${type}-${candidateId}.pdf`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    logger.error("PDF generation error", { ...ctx, error: error?.message })
    const message = error?.message || "Failed to generate PDF"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
