import { NextResponse, type NextRequest } from "next/server"
import puppeteer from "puppeteer"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: candidateId } = await context.params
  if (!candidateId) {
    return NextResponse.json({ error: "Missing candidate id" }, { status: 400 })
  }

  try {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000"
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https")
    const origin = `${proto}://${host}`
    const targetUrl = `${origin}/dashboard/candidates/${encodeURIComponent(candidateId)}`

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new",
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 })

    // Forward incoming cookies (user session) to Puppeteer so middleware sees the same auth
    const rawCookie = request.headers.get("cookie") || ""
    if (rawCookie) {
      const parsed = rawCookie
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((pair) => {
          const idx = pair.indexOf("=")
          const name = idx >= 0 ? pair.slice(0, idx) : pair
          const value = idx >= 0 ? pair.slice(idx + 1) : ""
          return { name, value, url: origin, path: "/" as const }
        })
      if (parsed.length > 0) {
        // Set cookies for the computed origin and common localhost variants to avoid host mismatches
        const urlVariants = [origin]
        if (origin.includes("localhost:")) {
          urlVariants.push(origin.replace("localhost", "127.0.0.1"))
        } else if (origin.includes("127.0.0.1:")) {
          urlVariants.push(origin.replace("127.0.0.1", "localhost"))
        }
        for (const url of urlVariants) {
          await page.setCookie(...parsed.map((c) => ({ ...c, url })))
        }
      }
    }

    const authHeader = request.headers.get("authorization")
    const extraHeaders: Record<string, string> = { "Accept-Language": "en-US,en;q=0.9" }
    if (authHeader) extraHeaders["Authorization"] = authHeader
    await page.setExtraHTTPHeaders(extraHeaders)
    await page.emulateMediaType("screen")
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 90000 })
    // Ensure the printable container is loaded and has content
    try {
      await page.waitForSelector("#candidate-print-container", { timeout: 30000 })
      // Ensure fonts and images are ready
      try {
        await page.evaluate(() => (document as any).fonts?.ready?.then?.(() => null))
      } catch {}
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
      await page.waitForFunction(
        () => {
          const el = document.querySelector("#candidate-print-container") as HTMLElement | null
          if (!el) return false
          const hasSize = el.clientHeight > 0 && el.clientWidth > 0
          const hasText = (el.innerText || "").trim().length > 0
          return hasSize && hasText
        },
        { timeout: 30000 },
      )
      // brief delay to allow images/fonts to finalize
      await page.waitForTimeout(500)
      // Validate container has rendered height
      const containerHeight = await page.evaluate(() => {
        const el = document.querySelector("#candidate-print-container") as HTMLElement | null
        return el ? el.getBoundingClientRect().height : 0
      })
      if (!containerHeight || containerHeight < 10) {
        throw new Error("Printable container has no height; content not rendered")
      }
    } catch (waitErr) {
      // Enhanced fallback with better styling and structure
      const apiUrl = `${origin}/api/candidates/${encodeURIComponent(candidateId)}`
      const apiRes = await fetch(apiUrl, { headers: authHeader ? { Authorization: authHeader } : {} })
      if (!apiRes.ok) {
        throw new Error(`Fallback API failed with status ${apiRes.status}`)
      }
      const apiJson = await apiRes.json()
      if (!apiJson.success) {
        throw new Error("Fallback API returned error")
      }
      const c = apiJson.data

      const printableHtml = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { 
            font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #fff; 
            color: #111; 
            font-size: 15px;
            line-height: 1.6;
          }
          .container { 
            max-width: 870px; 
            margin: 0 auto; 
            background: white; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            border-radius: 8px; 
            overflow: hidden;
          }
          .header { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            gap: 8px; 
            padding: 20px; 
            border-bottom: 2px solid #e5e7eb;
          }
          .logo { height: 60px; width: auto; }
          .form-title { 
            font-weight: bold; 
            text-align: center; 
            margin: 20px 0; 
            font-size: 18px;
          }
          .section { 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 16px; 
          }
          .section-title { 
            font-weight: 600; 
            margin-bottom: 12px; 
            color: #2563eb; 
            font-size: 16px;
          }
          .field-row { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            margin-bottom: 12px;
          }
          .field-label { 
            font-weight: 600; 
            min-width: 150px; 
            color: #374151;
          }
          .field-value { 
            flex: 1; 
            border-bottom: 2px solid #93c5fd; 
            padding-bottom: 4px; 
            min-height: 20px;
          }
          .grid-2 { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 16px;
          }
          .profile-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
          }
          .profile-image {
            width: 150px;
            height: 180px;
            border: 2px solid #000;
            object-fit: cover;
            flex-shrink: 0;
          }
          .profile-fields {
            flex: 1;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div id="candidate-print-container" class="container">
          <div class="header">
            <img src="/images/m1.PNG" alt="MINT International" class="logo" />
            <img src="/images/mint-logo.png" alt="MINT International" class="logo" />
            <img src="/images/m3.PNG" alt="MINT International" class="logo" />
          </div>
          
          <div class="form-title">FORM-A</div>
          
          <div class="section">
            <div class="profile-section">
              <div class="profile-fields">
                <div class="field-row">
                  <span class="field-label">Post Applied For:</span>
                  <div class="field-value">${c.post_applied_for || ""}</div>
                </div>
                <div class="field-row">
                  <span class="field-label">Referred By:</span>
                  <div class="field-value">${c.referred_by || ""}</div>
                </div>
                <div class="field-row">
                  <span class="field-label">Full Name:</span>
                  <div class="field-value">${c.full_name || ""}</div>
                </div>
                <div class="field-row">
                  <span class="field-label">Father Name:</span>
                  <div class="field-value">${c.father_name || ""}</div>
                </div>
              </div>
              ${c.profile_image ? `<img src="${c.profile_image}" alt="Profile" class="profile-image" />` : '<div class="profile-image" style="background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #6b7280;">No Photo</div>'}
            </div>
          </div>

          <div class="section">
            <div class="grid-2">
              <div class="field-row">
                <span class="field-label">Marital Status:</span>
                <div class="field-value">${c.marital_status || ""}</div>
              </div>
              <div class="field-row">
                <span class="field-label">Religion:</span>
                <div class="field-value">${c.religion || ""}</div>
              </div>
              <div class="field-row">
                <span class="field-label">Date of Birth:</span>
                <div class="field-value">${c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString() : ""}</div>
              </div>
              <div class="field-row">
                <span class="field-label">Place of Issue:</span>
                <div class="field-value">${c.place_of_issue || ""}</div>
              </div>
              <div class="field-row">
                <span class="field-label">Date of Issue:</span>
                <div class="field-value">${c.date_of_issue ? new Date(c.date_of_issue).toLocaleDateString() : ""}</div>
              </div>
              <div class="field-row">
                <span class="field-label">Date of Expiry:</span>
                <div class="field-value">${c.date_of_expiry ? new Date(c.date_of_expiry).toLocaleDateString() : ""}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="field-row">
              <span class="field-label">Passport No:</span>
              <div class="field-value" style="font-family: monospace;">${c.passport_no || ""}</div>
            </div>
          </div>

          <div class="section">
            <div class="field-row">
              <span class="field-label">Academic Qualifications:</span>
              <div class="field-value">${c.academic_qualifications || ""}</div>
            </div>
            <div class="field-row">
              <span class="field-label">Technical Qualifications:</span>
              <div class="field-value">${c.technical_qualifications || ""}</div>
            </div>
            <div class="field-row">
              <span class="field-label">Languages Known:</span>
              <div class="field-value">${Array.isArray(c.languages_known) ? c.languages_known.join(", ") : ""}</div>
            </div>
          </div>

          <div class="form-title">EXPERIENCE TOTAL (YEARS)</div>
          <div class="section">
            <div class="field-value" style="text-align: center; font-size: 16px; font-weight: 600;">
              ${c.experience_total || ""}
            </div>
          </div>

          <div class="section">
            <div class="field-row">
              <span class="field-label">Remarks:</span>
              <div class="field-value">${c.remarks || ""}</div>
            </div>
          </div>

          <div class="footer">
            <div class="field-row" style="margin-bottom: 0;">
              <span class="field-label">Date:</span>
              <div class="field-value" style="width: 150px;">${new Date(c.created_at).toLocaleDateString()}</div>
            </div>
            <div class="field-row" style="margin-bottom: 0;">
              <span class="field-label">Client Signature:</span>
              <div class="field-value" style="width: 200px;"></div>
            </div>
          </div>
        </div>
      </body>
      </html>`

      await page.setContent(printableHtml, { waitUntil: "load" })
      await page.emulateMediaType("screen")
      await page.waitForSelector("#candidate-print-container", { timeout: 15000 })
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    })

    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=candidate-${candidateId}.pdf`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    console.error("Puppeteer PDF error:", error)
    const message = error?.message || "Failed to generate PDF"
    const details = process.env.NODE_ENV !== "production" ? { stack: String(error?.stack || "") } : undefined
    return NextResponse.json({ error: message, ...details }, { status: 500 })
  }
}
