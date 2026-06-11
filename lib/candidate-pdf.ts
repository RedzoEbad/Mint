type CandidateRecord = Record<string, any>
type PdfDoc = InstanceType<typeof import("pdfkit")>

const MINT_BLUE = "#1a4b8c"
const LINE_BLUE = "#1a4b8c"
const BLACK = "#000000"
const ROW_HEIGHT = 13
const LABEL_FONT_SIZE = 7.5
const VALUE_FONT_SIZE = 7.5

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

function measureText(doc: PdfDoc, text: string, font: string, size: number): number {
  doc.font(font).fontSize(size)
  return doc.widthOfString(text)
}

function drawClippedText(
  doc: PdfDoc,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { font?: string; size?: number; align?: "left" | "center" | "right" } = {},
) {
  if (!text) return
  const font = options.font || "Helvetica"
  const size = options.size || VALUE_FONT_SIZE
  doc.save()
  doc.rect(x, y, width, height).clip()
  doc.font(font).fontSize(size).fillColor(BLACK).text(text, x, y, {
    width,
    height,
    ellipsis: true,
    lineBreak: true,
    align: options.align || "left",
  })
  doc.restore()
}

function drawClippedImage(doc: PdfDoc, buffer: Buffer, x: number, y: number, width: number, height: number) {
  doc.save()
  doc.rect(x, y, width, height).clip()
  try {
    doc.image(buffer, x, y, { fit: [width, height], align: "center", valign: "center" })
  } catch {
    // ignore broken image
  }
  doc.restore()
}

function drawReferenceHeader(
  doc: PdfDoc,
  headerBuffer: Buffer,
  left: number,
  pageWidth: number,
  startY: number,
): number {
  const headerHeight = 90

  try {
    doc.image(headerBuffer, left, startY, { fit: [pageWidth, headerHeight], align: "left", valign: "top" })
  } catch {
    return drawMintHeader(doc, null, left, pageWidth, startY)
  }

  doc.font("Helvetica").fontSize(6.5).fillColor(BLACK).text("0001", left, startY + headerHeight + 1)
  return startY + headerHeight + 8
}

function drawMintHeader(
  doc: PdfDoc,
  logoBuffer: Buffer | null | undefined,
  left: number,
  pageWidth: number,
  startY: number,
): number {
  const col1W = pageWidth * 0.36
  const col2W = pageWidth * 0.28
  const col3W = pageWidth * 0.36
  const col2X = left + col1W
  const col3X = left + col1W + col2W
  let y = startY

  doc.font("Helvetica-Bold").fontSize(13).fillColor(MINT_BLUE)
  drawClippedText(doc, "MINT INTERNATIONAL", left, y, col1W - 4, 14, { font: "Helvetica-Bold", size: 13 })

  const logoSize = 48
  const logoX = col2X + (col2W - logoSize) / 2
  if (logoBuffer) {
    try {
      drawClippedImage(doc, logoBuffer, logoX, y, logoSize, logoSize)
      doc.circle(logoX + logoSize / 2, y + logoSize / 2, logoSize / 2)
        .lineWidth(0.8)
        .strokeColor(MINT_BLUE)
        .stroke()
    } catch {
      drawLogoPlaceholder(doc, logoX, y, logoSize)
    }
  } else {
    drawLogoPlaceholder(doc, logoX, y, logoSize)
  }

  doc.font("Helvetica-Bold").fontSize(10).fillColor(MINT_BLUE)
  drawClippedText(doc, "MINT INTERNATIONAL", col3X, y + 2, col3W, 12, {
    font: "Helvetica-Bold",
    size: 10,
    align: "right",
  })

  y += 16
  const boxHeight = 24
  doc.rect(left, y, col1W - 6, boxHeight).lineWidth(0.5).strokeColor(BLACK).stroke()
  doc.font("Helvetica").fontSize(6).fillColor(BLACK)
  drawClippedText(doc, "Overseas Employment Promoter", left + 3, y + 3, col1W - 12, 8, { size: 6 })
  drawClippedText(doc, "Licence No. 1689", left + 3, y + 12, col1W - 12, 8, { size: 6 })

  doc.rect(col3X + 6, y, col3W - 6, boxHeight).lineWidth(0.5).strokeColor(BLACK).stroke()
  drawClippedText(doc, "Overseas Employment Promoter", col3X + 10, y + 3, col3W - 16, 8, { size: 6, align: "right" })
  drawClippedText(doc, "Licence No. 1689", col3X + 10, y + 12, col3W - 16, 8, { size: 6, align: "right" })

  y += boxHeight + 6
  const halfW = pageWidth / 2 - 4

  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(MINT_BLUE)
  drawClippedText(doc, "Rawalpindi / Islamabad", left, y, halfW, 9, { font: "Helvetica-Bold", size: 7.5 })
  drawClippedText(doc, "Karachi", left + halfW + 8, y, halfW, 9, { font: "Helvetica-Bold", size: 7.5 })

  y += 10
  doc.font("Helvetica").fontSize(5.8).fillColor(BLACK)
  drawClippedText(
    doc,
    "Office No. 22, 3rd Floor, Majeed Plaza, Bank Road, Saddar, Rawalpindi.\nTel: +92-51-5700075\nE-mail: mint1689@gmail.com\nE-mail: info@mintinternational.org",
    left,
    y,
    halfW,
    34,
    { size: 5.8 },
  )
  drawClippedText(
    doc,
    "Suite # 18/A, Faisal Market, Commercial Area, Shahra-e-Faisal, Malir Halt, Karachi.\nPh: 0092-21-34602406-410\nWebsite: www.mintinternational.org",
    left + halfW + 8,
    y,
    halfW,
    34,
    { size: 5.8 },
  )

  y += 36
  doc.font("Helvetica").fontSize(6.5).fillColor(BLACK).text("0001", left, y)

  return y + 8
}

function drawLogoPlaceholder(doc: PdfDoc, x: number, y: number, size: number) {
  const radius = size / 2
  doc.circle(x + radius, y + radius, radius).lineWidth(0.8).strokeColor(MINT_BLUE).stroke()
  doc.font("Helvetica-Bold").fontSize(9).fillColor(MINT_BLUE)
  drawClippedText(doc, "MI", x + radius - 8, y + radius - 5, 16, 10, { font: "Helvetica-Bold", size: 9, align: "center" })
}

function drawLineField(
  doc: PdfDoc,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  fixedLabelWidth?: number,
): number {
  doc.font("Helvetica-Bold").fontSize(LABEL_FONT_SIZE).fillColor(BLACK)
  const labelW = fixedLabelWidth ?? Math.min(measureText(doc, label, "Helvetica-Bold", LABEL_FONT_SIZE) + 3, width * 0.42)
  drawClippedText(doc, label, x, y + 1, labelW, 9, { font: "Helvetica-Bold", size: LABEL_FONT_SIZE })

  const lineStart = x + labelW
  const lineEnd = x + width
  const lineY = y + 9
  doc
    .moveTo(lineStart, lineY)
    .lineTo(lineEnd, lineY)
    .lineWidth(0.5)
    .strokeColor(LINE_BLUE)
    .stroke()

  drawClippedText(doc, value, lineStart + 2, y, lineEnd - lineStart - 4, 9, { size: VALUE_FONT_SIZE })

  return y + ROW_HEIGHT
}

function drawLineFieldPair(
  doc: PdfDoc,
  left: { label: string; value: string; labelWidth?: number },
  right: { label: string; value: string; labelWidth?: number },
  x: number,
  y: number,
  totalWidth: number,
  split: [number, number] = [0.5, 0.5],
): number {
  const gap = 8
  const available = totalWidth - gap
  const leftW = available * split[0]
  const rightW = available * split[1]
  drawLineField(doc, left.label, left.value, x, y, leftW, left.labelWidth)
  drawLineField(doc, right.label, right.value, x + leftW + gap, y, rightW, right.labelWidth)
  return y + ROW_HEIGHT
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
    drawClippedImage(doc, profileImageBuffer, x + 1, y + 1, width - 2, height - 2)
  }
}

function drawExperienceTable(
  doc: PdfDoc,
  rows: Array<{ company: string; period: string; trade: string }>,
  x: number,
  y: number,
  width: number,
): number {
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BLACK)
  drawClippedText(doc, "EXPERIENCE DETAILS", x, y, width, 9, { font: "Helvetica-Bold", size: 7.5, align: "center" })
  y += 11

  const colSr = 28
  const colPeriod = 118
  const colTrade = 78
  const colCompany = width - colSr - colPeriod - colTrade
  const rowHeight = 15
  const headerHeight = 13
  const tableHeight = headerHeight + rows.length * rowHeight

  doc.rect(x, y, width, tableHeight).lineWidth(0.7).strokeColor(BLACK).stroke()

  let cx = x
  const headers = [
    { label: "SR.NO", w: colSr },
    { label: "COMPANY", w: colCompany },
    { label: "PERIOD\nFROM-UPTO", w: colPeriod },
    { label: "TRADE", w: colTrade },
  ]

  doc.font("Helvetica-Bold").fontSize(5.8).fillColor(BLACK)
  for (const header of headers) {
    doc.rect(cx, y, header.w, headerHeight).stroke()
    drawClippedText(doc, header.label, cx + 2, y + 2, header.w - 4, headerHeight - 2, {
      font: "Helvetica-Bold",
      size: 5.8,
      align: "center",
    })
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
    for (const cell of cells) {
      doc.rect(cx, rowY, cell.w, rowHeight).stroke()
      drawClippedText(doc, cell.text, cx + 2, rowY + 3, cell.w - 4, rowHeight - 4, { size: 6.5 })
      cx += cell.w
    }
  })

  return y + tableHeight + 6
}

function drawExperienceTotalSection(
  doc: PdfDoc,
  total: string,
  extraLines: number,
  x: number,
  y: number,
  width: number,
): number {
  const label = "EXPERIENCE TOTAL (YEARS)"
  doc.font("Helvetica-Bold").fontSize(LABEL_FONT_SIZE).fillColor(BLACK)
  const labelW = measureText(doc, label, "Helvetica-Bold", LABEL_FONT_SIZE) + 4
  drawClippedText(doc, label, x, y + 1, labelW, 9, { font: "Helvetica-Bold", size: LABEL_FONT_SIZE })

  const lineStart = x + labelW
  doc
    .moveTo(lineStart, y + 9)
    .lineTo(x + width, y + 9)
    .lineWidth(0.5)
    .strokeColor(LINE_BLUE)
    .stroke()
  drawClippedText(doc, total, lineStart + 2, y, width - labelW - 4, 9, { size: VALUE_FONT_SIZE })

  y += ROW_HEIGHT
  for (let i = 0; i < extraLines; i++) {
    doc
      .moveTo(x, y + 9)
      .lineTo(x + width, y + 9)
      .lineWidth(0.5)
      .strokeColor(LINE_BLUE)
      .stroke()
    y += ROW_HEIGHT
  }

  return y + 2
}

function ensureSpace(doc: PdfDoc, y: number, needed: number): number {
  const bottom = doc.page.height - doc.page.margins.bottom
  if (y + needed > bottom) {
    doc.addPage()
    return doc.page.margins.top
  }
  return y
}

export async function generateCandidatePdf(options: {
  candidate: CandidateRecord
  type: "client" | "own"
  logoBuffer?: Buffer | null
  headerImageBuffer?: Buffer | null
  profileImageBuffer?: Buffer | null
}): Promise<Buffer> {
  const { candidate: c, type, logoBuffer, headerImageBuffer, profileImageBuffer } = options
  const isFormB = type === "client"
  const { default: PDFDocument } = await import("pdfkit")
  const doc = new PDFDocument({ size: "A4", margin: 30 })
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const left = doc.page.margins.left
  let y =
    headerImageBuffer != null
      ? drawReferenceHeader(doc, headerImageBuffer, left, pageWidth, doc.page.margins.top)
      : drawMintHeader(doc, logoBuffer, left, pageWidth, doc.page.margins.top)

  doc.font("Helvetica-Bold").fontSize(10).fillColor(BLACK)
  drawClippedText(doc, isFormB ? "FORM-B" : "FORM-A", left, y, pageWidth, 11, {
    font: "Helvetica-Bold",
    size: 10,
    align: "center",
  })
  y += 14

  const photoWidth = 78
  const photoHeight = isFormB ? 115 : 100
  const photoGap = 10
  const photoX = left + pageWidth - photoWidth
  const photoY = y
  const sideFieldWidth = pageWidth - photoWidth - photoGap

  drawPhotoBox(doc, photoX, photoY, photoWidth, photoHeight, profileImageBuffer)

  let fieldY = y
  fieldY = drawLineField(doc, "Post Applied For:", c.post_applied_for || "", left, fieldY, sideFieldWidth, 72)
  fieldY = drawLineField(doc, "Referred By:", c.referred_by || "", left, fieldY, sideFieldWidth, 72)
  fieldY = drawLineField(doc, "Full Name:", getFullName(c), left, fieldY, sideFieldWidth, 72)
  fieldY = drawLineField(doc, "Father's Name:", c.father_name || "", left, fieldY, sideFieldWidth, 72)

  const religion = c.religion || (isFormB ? "" : "ISLAM")
  fieldY = drawLineFieldPair(
    doc,
    { label: "Marital Status:", value: c.marital_status || "", labelWidth: 58 },
    { label: "Religion:", value: religion, labelWidth: 42 },
    left,
    fieldY,
    sideFieldWidth,
  )
  fieldY = drawLineFieldPair(
    doc,
    { label: "Date of Birth:", value: formatDate(c.date_of_birth), labelWidth: 58 },
    { label: "Place of Issue:", value: c.place_of_issue || "", labelWidth: 58 },
    left,
    fieldY,
    sideFieldWidth,
  )
  fieldY = drawLineFieldPair(
    doc,
    { label: "Date of Issue:", value: formatDate(c.date_of_issue), labelWidth: 58 },
    { label: "Date of Expiry:", value: formatDate(c.date_of_expiry), labelWidth: 58 },
    left,
    fieldY,
    sideFieldWidth,
  )

  if (isFormB) {
    fieldY = drawLineFieldPair(
      doc,
      { label: "Passport No:", value: c.passport_no || "", labelWidth: 58 },
      { label: "CNIC No:", value: c.citizenship_no || "", labelWidth: 42 },
      left,
      fieldY,
      sideFieldWidth,
    )
    fieldY = drawLineFieldPair(
      doc,
      { label: "Mobile No (1):", value: c.mobile_no_1 || "", labelWidth: 58 },
      { label: "Mobile No (2):", value: c.mobile_no_2 || "", labelWidth: 58 },
      left,
      fieldY,
      sideFieldWidth,
    )
  } else {
    fieldY = drawLineField(doc, "Passport No:", c.passport_no || "", left, fieldY, sideFieldWidth, 72)
  }

  y = Math.max(fieldY, photoY + photoHeight + 8)

  y = drawLineField(doc, "Academic Qualifications:", getAcademicQualifications(c), left, y, pageWidth, 108)
  y = drawLineField(doc, "Technical Qualifications:", getTechnicalQualifications(c), left, y, pageWidth, 108)
  y = drawLineField(doc, "Languages Known:", getLanguages(c), left, y, pageWidth, 88)

  y = ensureSpace(doc, y, 80)
  const experienceTotal = String(c.experience_total ?? "")
  y = drawExperienceTotalSection(doc, experienceTotal, isFormB ? 2 : 3, left, y + 2, pageWidth)
  y = ensureSpace(doc, y, 50)
  y = drawExperienceTable(doc, getExperienceRows(c), left, y, pageWidth)

  y = ensureSpace(doc, y, 40)
  y = drawLineField(doc, "Remarks:", c.remarks || "", left, y, pageWidth, 52)
  drawLineFieldPair(
    doc,
    { label: "Date:", value: formatDate(c.created_at), labelWidth: 30 },
    { label: "Candidates Signature:", value: "", labelWidth: 92 },
    left,
    y,
    pageWidth,
    [0.32, 0.68],
  )

  return renderPdfBuffer(doc)
}
