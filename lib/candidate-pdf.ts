type CandidateRecord = Record<string, any>
type PdfDoc = InstanceType<typeof import("pdfkit")>

const MINT_BLUE = "#1a4b8c"
const LINE_BLUE = "#1a4b8c"
const BLACK = "#000000"

function formatDate(value?: string | Date | null): string {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function getFullName(candidate: CandidateRecord): string {
  const parts = [candidate.full_name, candidate.surname].filter(Boolean)
  return parts.join(" ").trim()
}

function getAcademicQualifications(candidate: CandidateRecord): string {
  if (candidate.academic_qualifications) return String(candidate.academic_qualifications)
  const parts = [
    candidate.primary_school,
    candidate.secondary_school,
    candidate.higher_education,
    candidate.diploma,
  ].filter(Boolean)
  return parts.join("; ")
}

function getTechnicalQualifications(candidate: CandidateRecord): string {
  if (candidate.technical_qualifications) return String(candidate.technical_qualifications)
  const details = Array.isArray(candidate.technical_qualification_details)
    ? candidate.technical_qualification_details
    : []
  return details
    .map((tq: any) => {
      const parts = [tq.qualification_name || ""]
      if (tq.institution) parts.push(`— ${tq.institution}`)
      if (tq.year) parts.push(`(${tq.year})`)
      return parts.join(" ")
    })
    .filter(Boolean)
    .join("; ")
}

function getLanguages(candidate: CandidateRecord): string {
  return Array.isArray(candidate.languages_known) ? candidate.languages_known.join(", ") : ""
}

function getExperienceRows(candidate: CandidateRecord): Array<{ company: string; period: string; trade: string }> {
  const details = Array.isArray(candidate.experience_details) ? candidate.experience_details : []
  const rows = details.map((exp: any) => ({
    company: exp.company_name || "",
    period: exp.duration || "",
    trade: exp.trade || "",
  }))
  while (rows.length < 2) rows.push({ company: "", period: "", trade: "" })
  return rows.slice(0, 2)
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

function drawMintHeader(doc: PdfDoc, logoBuffer: Buffer | null | undefined, left: number, pageWidth: number, startY: number): number {
  const colWidth = pageWidth / 3
  let y = startY

  doc.font("Helvetica-Bold").fontSize(15).fillColor(MINT_BLUE)
  doc.text("MINT INTERNATIONAL", left, y, { width: colWidth })

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, left + colWidth + colWidth / 2 - 28, y - 4, { fit: [56, 56], align: "center" })
    } catch {
      drawLogoPlaceholder(doc, left + colWidth + colWidth / 2 - 22, y)
    }
  } else {
    drawLogoPlaceholder(doc, left + colWidth + colWidth / 2 - 22, y)
  }

  doc.font("Helvetica-Bold").fontSize(11).fillColor(MINT_BLUE)
  doc.text("مينت انترناشيونال", left + colWidth * 2, y, { width: colWidth, align: "right" })

  y += 18
  const boxHeight = 22
  doc.rect(left, y, colWidth - 8, boxHeight).lineWidth(0.5).strokeColor(BLACK).stroke()
  doc.font("Helvetica").fontSize(6.5).fillColor(BLACK)
  doc.text("Overseas Employment Promoter", left + 4, y + 4, { width: colWidth - 12 })
  doc.text("Licence No. 1689", left + 4, y + 12, { width: colWidth - 12 })

  doc.rect(left + colWidth * 2 + 8, y, colWidth - 8, boxHeight).lineWidth(0.5).strokeColor(BLACK).stroke()
  doc.font("Helvetica").fontSize(6.5).fillColor(BLACK)
  doc.text("وكيل توظيف خارجي", left + colWidth * 2 + 12, y + 4, { width: colWidth - 16, align: "right" })
  doc.text("رقم الترخيص ١٦٨٩", left + colWidth * 2 + 12, y + 12, { width: colWidth - 16, align: "right" })

  y += boxHeight + 8
  const branchY = y

  doc.font("Helvetica-Bold").fontSize(8).fillColor(MINT_BLUE)
  doc.text("Rawalpindi / Islamabad", left, branchY, { width: pageWidth / 2 - 6 })
  doc.text("Karachi", left + pageWidth / 2 + 6, branchY, { width: pageWidth / 2 - 6 })

  y += 11
  doc.font("Helvetica").fontSize(6.5).fillColor(BLACK)
  doc.text(
    "Office No. 22, 3rd Floor, Majeed Plaza, Bank Road, Saddar, Rawalpindi.\nTel: +92-51-5700075\nE-mail: mint1689@gmail.com\nE-mail: info@mintinternational.org",
    left,
    y,
    { width: pageWidth / 2 - 6, lineGap: 1 },
  )
  doc.text(
    "Suite # 18/A, Faisal Market, Commercial Area, Shahra-e-Faisal, Malir Halt, Karachi.\nPh: 0092-21-34602406-410\nWebsite: www.mintinternational.org",
    left + pageWidth / 2 + 6,
    y,
    { width: pageWidth / 2 - 6, lineGap: 1 },
  )

  y += 38
  doc.font("Helvetica").fontSize(7).fillColor(BLACK).text("0001", left, y)

  return y + 10
}

function drawLogoPlaceholder(doc: PdfDoc, x: number, y: number) {
  doc.circle(x + 22, y + 22, 22).lineWidth(0.8).strokeColor(MINT_BLUE).stroke()
  doc.font("Helvetica-Bold").fontSize(10).fillColor(MINT_BLUE).text("MI", x + 14, y + 16)
}

function measureLabelWidth(doc: PdfDoc, label: string): number {
  return doc.widthOfString(label, { characterSpacing: 0 })
}

function drawLineField(
  doc: PdfDoc,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  labelWidth = 0,
): number {
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BLACK).text(label, x, y, { lineBreak: false })
  const lw = labelWidth || measureLabelWidth(doc, label) + 4
  const lineStart = x + lw
  const lineY = y + 9
  doc
    .moveTo(lineStart, lineY)
    .lineTo(x + width, lineY)
    .lineWidth(0.6)
    .strokeColor(LINE_BLUE)
    .stroke()

  if (value) {
    doc.font("Helvetica").fontSize(8).fillColor(BLACK).text(value, lineStart + 2, y + 1, {
      width: x + width - lineStart - 4,
      height: 10,
      ellipsis: true,
      lineBreak: false,
    })
  }

  return y + 14
}

function drawLineFieldPair(
  doc: PdfDoc,
  left: { label: string; value: string },
  right: { label: string; value: string },
  x: number,
  y: number,
  totalWidth: number,
): number {
  const half = totalWidth / 2 - 4
  drawLineField(doc, left.label, left.value, x, y, half)
  drawLineField(doc, right.label, right.value, x + half + 8, y, half)
  return y + 14
}

function drawPhotoBox(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  height: number,
  profileImageBuffer?: Buffer | null,
) {
  doc.rect(x, y, width, height).lineWidth(1).strokeColor(BLACK).stroke()
  if (profileImageBuffer) {
    try {
      doc.image(profileImageBuffer, x + 2, y + 2, { fit: [width - 4, height - 4] })
      return
    } catch {
      // fall through
    }
  }
}

function drawExperienceTable(
  doc: PdfDoc,
  rows: Array<{ company: string; period: string; trade: string }>,
  x: number,
  y: number,
  width: number,
): number {
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BLACK).text("EXPERIENCE DETAILS", x, y, {
    width,
    align: "center",
  })
  y += 12

  const colSr = 32
  const colPeriod = 130
  const colTrade = 90
  const colCompany = width - colSr - colPeriod - colTrade
  const rowHeight = 16
  const headerHeight = 14
  const tableHeight = headerHeight + rows.length * rowHeight

  doc.rect(x, y, width, tableHeight).lineWidth(0.8).strokeColor(BLACK).stroke()

  let cx = x
  const headers = [
    { label: "SR.NO", w: colSr },
    { label: "COMPANY", w: colCompany },
    { label: "PERIOD FROM-UPTO", w: colPeriod },
    { label: "TRADE", w: colTrade },
  ]

  doc.font("Helvetica-Bold").fontSize(6.5).fillColor(BLACK)
  for (const header of headers) {
    doc.rect(cx, y, header.w, headerHeight).stroke()
    doc.text(header.label, cx + 2, y + 3, { width: header.w - 4, align: "center" })
    cx += header.w
  }

  rows.forEach((row, index) => {
    const rowY = y + headerHeight + index * rowHeight
    cx = x
    const cells = [
      { text: String(index + 1), w: colSr },
      { text: row.company, w: colCompany },
      { text: row.period, w: colPeriod },
      { text: row.trade, w: colTrade },
    ]
    doc.font("Helvetica").fontSize(7).fillColor(BLACK)
    for (const cell of cells) {
      doc.rect(cx, rowY, cell.w, rowHeight).stroke()
      doc.text(cell.text, cx + 3, rowY + 4, { width: cell.w - 6, height: rowHeight - 4, ellipsis: true })
      cx += cell.w
    }
  })

  return y + tableHeight + 8
}

function drawExperienceTotalSection(
  doc: PdfDoc,
  total: string,
  extraLines: number,
  x: number,
  y: number,
  width: number,
): number {
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BLACK).text("EXPERIENCE TOTAL (YEARS)", x, y, { lineBreak: false })
  const labelW = measureLabelWidth(doc, "EXPERIENCE TOTAL (YEARS)") + 6
  const lineStart = x + labelW
  doc
    .moveTo(lineStart, y + 9)
    .lineTo(x + width, y + 9)
    .lineWidth(0.6)
    .strokeColor(LINE_BLUE)
    .stroke()
  if (total) {
    doc.font("Helvetica").fontSize(8).fillColor(BLACK).text(total, lineStart + 2, y + 1)
  }

  y += 14
  for (let i = 0; i < extraLines; i++) {
    doc
      .moveTo(x, y + 9)
      .lineTo(x + width, y + 9)
      .lineWidth(0.6)
      .strokeColor(LINE_BLUE)
      .stroke()
    y += 14
  }

  return y + 4
}

export async function generateCandidatePdf(options: {
  candidate: CandidateRecord
  type: "client" | "own"
  logoBuffer?: Buffer | null
  profileImageBuffer?: Buffer | null
}): Promise<Buffer> {
  const { candidate: c, type, logoBuffer, profileImageBuffer } = options
  const isFormB = type === "client"
  const { default: PDFDocument } = await import("pdfkit")
  const doc = new PDFDocument({ size: "A4", margin: 24 })
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const left = doc.page.margins.left
  let y = drawMintHeader(doc, logoBuffer, left, pageWidth, doc.page.margins.top)

  doc.font("Helvetica-Bold").fontSize(11).fillColor(BLACK)
  doc.text(isFormB ? "FORM-B" : "FORM-A", left, y, { width: pageWidth, align: "center" })
  y += 18

  const photoWidth = 88
  const photoHeight = 108
  const photoX = left + pageWidth - photoWidth
  const photoY = y
  const fieldsWidth = pageWidth - photoWidth - 8

  drawPhotoBox(doc, photoX, photoY, photoWidth, photoHeight, profileImageBuffer)

  let fieldY = y + 2
  fieldY = drawLineField(doc, "Post Applied For:", c.post_applied_for || "", left, fieldY, fieldsWidth)
  fieldY = drawLineField(doc, "Referred By:", c.referred_by || "", left, fieldY, fieldsWidth)
  fieldY = drawLineField(doc, "Full Name:", getFullName(c), left, fieldY, fieldsWidth)
  fieldY = drawLineField(doc, "Father's Name:", c.father_name || "", left, fieldY, fieldsWidth)

  const religion = c.religion || (isFormB ? "" : "ISLAM")
  fieldY = drawLineFieldPair(
    doc,
    { label: "Marital Status:", value: c.marital_status || "" },
    { label: "Religion:", value: religion },
    left,
    fieldY,
    fieldsWidth,
  )
  fieldY = drawLineFieldPair(
    doc,
    { label: "Date of Birth:", value: formatDate(c.date_of_birth) },
    { label: "Place of Issue:", value: c.place_of_issue || "" },
    left,
    fieldY,
    fieldsWidth,
  )
  fieldY = drawLineFieldPair(
    doc,
    { label: "Date of Issue:", value: formatDate(c.date_of_issue) },
    { label: "Date of Expiry:", value: formatDate(c.date_of_expiry) },
    left,
    fieldY,
    fieldsWidth,
  )

  if (isFormB) {
    fieldY = drawLineFieldPair(
      doc,
      { label: "Passport No:", value: c.passport_no || "" },
      { label: "CNIC No:", value: c.citizenship_no || "" },
      left,
      fieldY,
      fieldsWidth,
    )
    fieldY = drawLineFieldPair(
      doc,
      { label: "Mobile No (1):", value: c.mobile_no_1 || "" },
      { label: "Mobile No (2):", value: c.mobile_no_2 || "" },
      left,
      fieldY,
      fieldsWidth,
    )
  } else {
    fieldY = drawLineField(doc, "Passport No:", c.passport_no || "", left, fieldY, fieldsWidth)
  }

  fieldY = drawLineField(doc, "Academic Qualifications:", getAcademicQualifications(c), left, fieldY, pageWidth)
  fieldY = drawLineField(doc, "Technical Qualifications:", getTechnicalQualifications(c), left, fieldY, pageWidth)
  fieldY = drawLineField(doc, "Languages Known:", getLanguages(c), left, fieldY, pageWidth)

  const experienceTotal = String(c.experience_total ?? "")
  fieldY = drawExperienceTotalSection(doc, experienceTotal, isFormB ? 2 : 3, left, fieldY + 4, pageWidth)
  fieldY = drawExperienceTable(doc, getExperienceRows(c), left, fieldY, pageWidth)

  fieldY = drawLineField(doc, "Remarks:", c.remarks || "", left, fieldY, pageWidth)
  drawLineFieldPair(
    doc,
    { label: "Date:", value: formatDate(c.created_at) },
    { label: "Candidates Signature:", value: "" },
    left,
    fieldY,
    pageWidth,
  )

  return renderPdfBuffer(doc)
}
