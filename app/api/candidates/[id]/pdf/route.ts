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
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https")
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
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
          })
        )
      })
      await page.waitForFunction(() => {
        const el = document.querySelector("#candidate-print-container") as HTMLElement | null
        if (!el) return false
        const hasSize = el.clientHeight > 0 && el.clientWidth > 0
        const hasText = (el.innerText || "").trim().length > 0
        return hasSize && hasText
      }, { timeout: 30000 })
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
      // Fallback: render a minimal printable HTML from API data without visiting the dashboard route
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
        <meta charset=\"utf-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
        <style>
          body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #111; }
          .container { padding: 16px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
          .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .label { font-size: 12px; color: #6b7280; }
          .value { font-size: 14px; white-space: pre-wrap; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
          .badge { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #c7d2fe; background: #eef2ff; color: #1e3a8a; padding: 4px 8px; border-radius: 9999px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div id=\"candidate-print-container\" class=\"container\">
          <div class=\"header\">
            <div style=\"display:flex;align-items:center;gap:12px;\">
              <img src=\"/images/mint-logo.png\" alt=\"MINT International\" style=\"height:32px;width:auto\" />
              <div>
                <div style=\"font-weight:600\">MINT International</div>
                <div style=\"font-size:12px;color:#6b7280\">Candidate Form</div>
              </div>
            </div>
            <div style=\"font-size:12px;color:#6b7280\">${new Date().toLocaleString()}</div>
          </div>

          <div class=\"card\">
            <div style=\"font-weight:600;margin-bottom:8px\">Personal Information</div>
            <div class=\"row\">
              <div><div class=\"label\">Full name</div><div class=\"value\">${c.full_name || "-"}</div></div>
              <div><div class=\"label\">Father name</div><div class=\"value\">${c.father_name || "-"}</div></div>
              <div><div class=\"label\">Marital status</div><div class=\"value\">${c.marital_status || "-"}</div></div>
              <div><div class=\"label\">Religion</div><div class=\"value\">${c.religion || "-"}</div></div>
              <div><div class=\"label\">Date of birth</div><div class=\"value\">${(c.date_of_birth || "").slice(0,10)}</div></div>
              <div><div class=\"label\">Date of issue</div><div class=\"value\">${(c.date_of_issue || "").slice(0,10)}</div></div>
              <div><div class=\"label\">Date of expiry</div><div class=\"value\">${(c.date_of_expiry || "").slice(0,10)}</div></div>
              <div><div class=\"label\">Place of issue</div><div class=\"value\">${c.place_of_issue || "-"}</div></div>
              <div><div class=\"label\">Passport no</div><div class=\"value\">${c.passport_no || "-"}</div></div>
            </div>
          </div>

          <div class=\"card\">
            <div style=\"font-weight:600;margin-bottom:8px\">Qualifications</div>
            <div class=\"value\"><span class=\"label\">Academic qualifications</span>\n${c.academic_qualifications || "-"}</div>
            <div class=\"value\" style=\"margin-top:8px\"><span class=\"label\">Technical qualifications</span>\n${c.technical_qualifications || "-"}</div>
            ${(Array.isArray(c.languages_known) && c.languages_known.length > 0) ? `<div style=\"margin-top:8px\"><span class=\"label\">Languages known</span><div style=\"margin-top:6px\">${c.languages_known.map((lang: string) => `<span class=\"badge\">${lang}</span>`).join(" ")}</div></div>` : ""}
          </div>

          <div class=\"card\">
            <div style=\"font-weight:600;margin-bottom:8px\">Role & Experience</div>
            <div class=\"row\">
              <div><div class=\"label\">Post applied for</div><div class=\"value\">${c.post_applied_for || "-"}</div></div>
              <div><div class=\"label\">Referred by</div><div class=\"value\">${c.referred_by || "-"}</div></div>
              <div><div class=\"label\">Experience total (years)</div><div class=\"value\">${c.experience_total || "-"}</div></div>
              <div style=\"grid-column: 1 / -1\"><div class=\"label\">Remarks</div><div class=\"value\">${c.remarks || "-"}</div></div>
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


