type CandidateRecord = Record<string, any>
type PdfDoc = InstanceType<typeof import("pdfkit")>

function formatDate(value?: string | Date | null): string {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString()
}

function drawField(doc: PdfDoc, label: string, value: string, x: number, y: number, width: number) {
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#374151").text(label, x, y, { width: 130 })
  const boxY = y - 2
  doc
    .roundedRect(x + 135, boxY, width - 135, 18, 4)
    .lineWidth(0.5)
    .strokeColor("#d1d5db")
    .fillColor("#f9fafb")
    .fillAndStroke()
  doc.font("Helvetica").fontSize(10).fillColor("#111827").text(value || "", x + 142, y, {
    width: width - 150,
    height: 16,
    ellipsis: true,
  })
  return y + 24
}

function drawSectionBox(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  doc.roundedRect(x, y, width, height, 8).lineWidth(1).strokeColor("#d1d5db").stroke()
}

async function renderPdfBuffer(doc: PdfDoc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
    doc.end()
  })
}

export async function generateCandidatePdf(options: {
  candidate: CandidateRecord
  type: "client" | "own"
  logoBuffer?: Buffer | null
  profileImageBuffer?: Buffer | null
}): Promise<Buffer> {
  const { candidate: c, type, logoBuffer, profileImageBuffer } = options
  const isClient = type === "client"
  const { default: PDFDocument } = await import("pdfkit")
  const doc = new PDFDocument({ size: "A4", margin: 36 })
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const left = doc.page.margins.left
  let y = doc.page.margins.top

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, left + pageWidth / 2 - 40, y, { fit: [80, 40], align: "center" })
    } catch {
      // skip broken logo
    }
  }

  y += 48
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#111827")
    .text(`FORM-A${isClient ? " (CLIENT COPY)" : ""}`, left, y, { width: pageWidth, align: "center" })

  y += 28
  const sectionX = left
  const sectionWidth = pageWidth
  const profileBoxHeight = 150
  drawSectionBox(doc, sectionX, y, sectionWidth, profileBoxHeight)

  const fieldsWidth = sectionWidth - 170
  let fieldY = y + 14
  fieldY = drawField(doc, "Post Applied For:", c.post_applied_for || "", sectionX + 12, fieldY, fieldsWidth)
  fieldY = drawField(doc, "Referred By:", c.referred_by || "", sectionX + 12, fieldY, fieldsWidth)
  fieldY = drawField(doc, "Given Names:", c.full_name || "", sectionX + 12, fieldY, fieldsWidth)
  fieldY = drawField(doc, "Surname:", c.surname || "", sectionX + 12, fieldY, fieldsWidth)
  drawField(doc, "Father Name:", c.father_name || "", sectionX + 12, fieldY, fieldsWidth)

  const photoX = sectionX + sectionWidth - 132
  const photoY = y + 12
  doc.roundedRect(photoX, photoY, 120, 126, 6).lineWidth(1).strokeColor("#d1d5db").stroke()
  if (profileImageBuffer) {
    try {
      doc.image(profileImageBuffer, photoX + 2, photoY + 2, { fit: [116, 122] })
    } catch {
      doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("No Photo", photoX + 34, photoY + 58)
    }
  } else {
    doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("No Photo", photoX + 34, photoY + 58)
  }

  y += profileBoxHeight + 14

  if (!isClient) {
    const personalHeight = 120
    drawSectionBox(doc, sectionX, y, sectionWidth, personalHeight)
    let rowY = y + 12
    rowY = drawField(doc, "Marital Status:", c.marital_status || "", sectionX + 12, rowY, sectionWidth / 2 - 8)
    drawField(doc, "Religion:", c.religion || "", sectionX + sectionWidth / 2, rowY - 24, sectionWidth / 2 - 12)
    rowY = drawField(doc, "Sex:", c.sex || "", sectionX + 12, rowY, sectionWidth / 2 - 8)
    drawField(doc, "Citizenship No:", c.citizenship_no || "", sectionX + sectionWidth / 2, rowY - 24, sectionWidth / 2 - 12)
    rowY = drawField(doc, "Date of Birth:", formatDate(c.date_of_birth), sectionX + 12, rowY, sectionWidth / 2 - 8)
    drawField(doc, "Place of Issue:", c.place_of_issue || "", sectionX + sectionWidth / 2, rowY - 24, sectionWidth / 2 - 12)
    rowY = drawField(doc, "Date of issue:", formatDate(c.date_of_issue), sectionX + 12, rowY, sectionWidth / 2 - 8)
    drawField(doc, "Date of expiry:", formatDate(c.date_of_expiry), sectionX + sectionWidth / 2, rowY - 24, sectionWidth / 2 - 12)
    y += personalHeight + 14

    const passportHeight = 42
    drawSectionBox(doc, sectionX, y, sectionWidth, passportHeight)
    drawField(doc, "Passport No:", c.passport_no || "", sectionX + 12, y + 12, sectionWidth - 24)
    y += passportHeight + 14
  }

  const languages = Array.isArray(c.languages_known) ? c.languages_known.join(", ") : ""
  const techLines = Array.isArray(c.technical_qualification_details)
    ? c.technical_qualification_details.map((tq: any) => {
        const parts = [tq.qualification_name || ""]
        if (tq.institution) parts.push(`— ${tq.institution}`)
        if (tq.year) parts.push(`(${tq.year})`)
        return parts.join(" ")
      })
    : []

  const educationHeight = 132 + techLines.length * 14
  drawSectionBox(doc, sectionX, y, sectionWidth, educationHeight)
  let eduY = y + 12
  eduY = drawField(doc, "Primary School:", c.primary_school || "", sectionX + 12, eduY, sectionWidth - 24)
  eduY = drawField(doc, "Secondary School:", c.secondary_school || "", sectionX + 12, eduY, sectionWidth - 24)
  eduY = drawField(doc, "Higher Education:", c.higher_education || "", sectionX + 12, eduY, sectionWidth - 24)
  eduY = drawField(doc, "Diploma:", c.diploma || "", sectionX + 12, eduY, sectionWidth - 24)
  eduY = drawField(doc, "Languages Known:", languages, sectionX + 12, eduY, sectionWidth - 24)
  if (techLines.length > 0) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#374151").text("Technical Qualifications:", sectionX + 12, eduY)
    doc.font("Helvetica").fontSize(10).fillColor("#111827").text(techLines.join("\n"), sectionX + 150, eduY, {
      width: sectionWidth - 162,
    })
  }
  y += educationHeight + 14

  if (!isClient) {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111827")
      .text("EXPERIENCE (YEARS)", left, y, { width: pageWidth, align: "center" })
    y += 20

    const expHeight = 78
    drawSectionBox(doc, sectionX, y, sectionWidth, expHeight)
    let expY = y + 12
    expY = drawField(doc, "GCC Experience:", String(c.gcc_experience ?? ""), sectionX + 12, expY, sectionWidth / 2 - 8)
    drawField(doc, "KSA Experience:", String(c.ksa_experience ?? ""), sectionX + sectionWidth / 2, expY - 24, sectionWidth / 2 - 12)
    expY = drawField(doc, "Local Experience:", String(c.local_experience ?? ""), sectionX + 12, expY, sectionWidth / 2 - 8)
    drawField(doc, "Total Experience:", String(c.experience_total ?? ""), sectionX + sectionWidth / 2, expY - 24, sectionWidth / 2 - 12)
    y += expHeight + 14

    const remarksHeight = 42
    drawSectionBox(doc, sectionX, y, sectionWidth, remarksHeight)
    drawField(doc, "Remarks:", c.remarks || "", sectionX + 12, y + 12, sectionWidth - 24)
    y += remarksHeight + 14
  }

  drawField(doc, "Date:", formatDate(c.created_at), sectionX, y, sectionWidth / 2)
  drawField(doc, "Client Signature:", "", sectionX + sectionWidth / 2, y, sectionWidth / 2)

  return renderPdfBuffer(doc)
}
