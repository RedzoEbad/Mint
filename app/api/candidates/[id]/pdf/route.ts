import { NextResponse, type NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { logger, getRequestContext } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const secret = process.env.NEXTAUTH_SECRET || "mint-international-secret-key-2024"

let browserPromise: Promise<any> | null = null

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      if (process.env.VERCEL || process.env.NODE_ENV === "production") {
        const chromium = await import("@sparticuz/chromium").then((m) => m.default)
        const puppeteer = await import("puppeteer-core")

        // Configuration for Vercel
        return puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        })
      } else {
        // Configuration for local development
        const puppeteer = await import("puppeteer")
        return puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          headless: "new" as any
        })
      }
    })()
  }
  return browserPromise
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request)
  const { id: candidateId } = await context.params
  if (!candidateId) {
    logger.warn("PDF: missing candidate id", ctx)
    return NextResponse.json({ error: "Missing candidate id" }, { status: 400 })
  }

  try {
    // Authenticate using NextAuth
    const token = await getToken({ req: request, secret })
    const allowed = ["super_admin", "receptionist"]
    if (!token || !allowed.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000"
    const proto =
      request.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https")
    const origin = `${proto}://${host}`

    // Fetch candidate data directly (avoid rendering the dashboard page entirely)
    const authHeader = request.headers.get("authorization")
    const cookieHeader = request.headers.get("cookie")
    const apiUrl = `${origin}/api/candidates/${encodeURIComponent(candidateId)}`
    const forwardHeaders: Record<string, string> = {}
    if (authHeader) forwardHeaders["Authorization"] = authHeader
    if (cookieHeader) forwardHeaders["Cookie"] = cookieHeader

    const apiRes = await fetch(apiUrl, { headers: forwardHeaders, redirect: "manual" })
    if (apiRes.status === 301 || apiRes.status === 302 || apiRes.status === 307 || apiRes.status === 308) {
      logger.warn("PDF: upstream redirected", { ...ctx, status: apiRes.status })
      return NextResponse.json({ error: "Unauthorized or redirected while fetching candidate" }, { status: 401 })
    }
    if (!apiRes.ok) {
      logger.error("PDF: data fetch failed", { ...ctx, status: apiRes.status })
      return NextResponse.json({ error: `Data fetch failed (${apiRes.status})` }, { status: 500 })
    }
    const contentType = apiRes.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      const bodyText = await apiRes.text().catch(() => "")
      logger.error("PDF: upstream returned non-JSON", { ...ctx, snippet: bodyText.slice(0, 120) })
      return NextResponse.json(
        { error: "Upstream returned non-JSON response", details: bodyText.slice(0, 300) },
        { status: 502 },
      )
    }
    const apiJson = await apiRes.json()
    if (!apiJson?.success) {
      return NextResponse.json({ error: "API returned error" }, { status: 500 })
    }
    const c = apiJson.data

    const logoUrl = `${origin}/images/mint-logo.png`
    const profileImageUrl = c.profile_image && typeof c.profile_image === "string"
      ? (c.profile_image.startsWith("http://") || c.profile_image.startsWith("https://")
        ? c.profile_image
        : `${origin}${c.profile_image.startsWith("/") ? c.profile_image : `/${c.profile_image}`}`)
      : ""

    const printableHtml = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <base href="${origin}">
        <style>
          @page { size: A4; margin: 10mm; }
          html, body { height: 100%; }
          body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #111; font-size: 13px; line-height: 1.5; }
          .container { width: 100%; max-width: 100%; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
          .header { display: flex; justify-content: center; align-items: center; padding: 8px 0 4px; }
          .logo { height: 40px; width: auto; }
          .form-title { font-weight: 700; text-align: center; margin: 8px 0 12px; font-size: 14px; letter-spacing: .5px; }
          .section { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin: 12px 12px; page-break-inside: avoid; }
          .section-title { font-weight: 600; margin-bottom: 10px; color: #1f2937; font-size: 13px; }
          .field-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
          .field-label { font-weight: 600; min-width: 140px; color: #374151; font-size: 12px; }
          .field-value { flex: 1; border: 1px solid #d1d5db; background: #f9fafb; border-radius: 6px; padding: 6px 8px; min-height: 20px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .profile-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
          .profile-image { width: 140px; height: 170px; border: 1px solid #d1d5db; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
          .profile-fields { flex: 1; }
          .footer { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-top: 1px solid #e5e7eb; margin: 12px; page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div id="candidate-print-container" class="container">
          <div class="header">
            <img src="${logoUrl}" alt="MINT International" class="logo" />
          </div>
          <div class="form-title">FORM-A</div>
          <div class="section">
            <div class="profile-section">
              <div class="profile-fields">
                <div class="field-row"><span class="field-label">Post Applied For:</span><div class="field-value">${c.post_applied_for || ""}</div></div>
                <div class="field-row"><span class="field-label">Referred By:</span><div class="field-value">${c.referred_by || ""}</div></div>
                <div class="field-row"><span class="field-label">Full Name:</span><div class="field-value">${c.full_name || ""}</div></div>
                <div class="field-row"><span class="field-label">Father Name:</span><div class="field-value">${c.father_name || ""}</div></div>
              </div>
              ${profileImageUrl ? `<img src="${profileImageUrl}" alt="Profile" class="profile-image" />` : '<div class="profile-image" style="background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #6b7280;">No Photo</div>'}
            </div>
          </div>
          <div class="section">
            <div class="grid-2">
              <div class="field-row"><span class="field-label">Marital Status:</span><div class="field-value">${c.marital_status || ""}</div></div>
              <div class="field-row"><span class="field-label">Religion:</span><div class="field-value">${c.religion || ""}</div></div>
              <div class="field-row"><span class="field-label">Date of Birth:</span><div class="field-value">${c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString() : ""}</div></div>
              <div class="field-row"><span class="field-label">Place of Issue:</span><div class="field-value">${c.place_of_issue || ""}</div></div>
              <div class="field-row"><span class="field-label">Date of issue:</span><div class="field-value">${c.date_of_issue ? new Date(c.date_of_issue).toLocaleDateString() : ""}</div></div>
              <div class="field-row"><span class="field-label">Date of expiry:</span><div class="field-value">${c.date_of_expiry ? new Date(c.date_of_expiry).toLocaleDateString() : ""}</div></div>
            </div>
          </div>
          <div class="section">
            <div class="field-row"><span class="field-label">Passport No:</span><div class="field-value" style="font-family: monospace;">${c.passport_no || ""}</div></div>
          </div>
          <div class="section">
            <div class="field-row"><span class="field-label">Academic Qualifications:</span><div class="field-value">${c.academic_qualifications || ""}</div></div>
            <div class="field-row"><span class="field-label">Technical Qualifications:</span><div class="field-value">${c.technical_qualifications || ""}</div></div>
            <div class="field-row"><span class="field-label">Languages Known:</span><div class="field-value">${Array.isArray(c.languages_known) ? c.languages_known.join(", ") : ""}</div></div>
          </div>
          <div class="form-title">EXPERIENCE TOTAL (YEARS)</div>
          <div class="section"><div class="field-value" style="text-align: center; font-size: 14px; font-weight: 600; background:#fff;">${c.experience_total || ""}</div></div>
          <div class="section"><div class="field-row"><span class="field-label">Remarks:</span><div class="field-value">${c.remarks || ""}</div></div></div>
          <div class="footer">
            <div class="field-row" style="margin-bottom: 0;"><span class="field-label">Date:</span><div class="field-value" style="width: 150px;">${c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</div></div>
            <div class="field-row" style="margin-bottom: 0;"><span class="field-label">Client Signature:</span><div class="field-value" style="width: 200px;"></div></div>
          </div>
        </div>
      </body>
      </html>`

    const browser = await getBrowser()
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 })
    await page.emulateMediaType("screen")
    await page.setContent(printableHtml, { waitUntil: "load" })
    // Ensure images and fonts are loaded
    try {
      await page.evaluate(() => (document as any).fonts?.ready?.then?.(() => null))
    } catch { }
    await page.evaluate(async () => {
      const images = Array.from(document.images)
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve(true)
          return new Promise((resolve) => {
            img.addEventListener("load", () => resolve(true))
            img.addEventListener("error", () => resolve(true))
          })
        }),
      )
    })
    await page.waitForSelector("#candidate-print-container", { timeout: 15000 })
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    })
    await page.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=candidate-${candidateId}.pdf`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    logger.error("Puppeteer PDF error", { ...ctx, error: error?.message })
    const message = error?.message || "Failed to generate PDF"
    const details = process.env.NODE_ENV !== "production" ? { stack: String(error?.stack || "") } : undefined
    return NextResponse.json({ error: message, ...details }, { status: 500 })
  }
}


