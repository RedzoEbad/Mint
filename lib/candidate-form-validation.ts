type TechnicalQualInput = {
  qualification_name: string
  institution: string
  year: string
  hasCertificate: boolean
}

export type CandidateFormValues = {
  full_name: string
  surname: string
  father_name: string
  date_of_birth?: Date
  marital_status: string
  religion: string
  sex: string
  citizenship_no: string
  passport_no: string
  date_of_issue?: Date
  date_of_expiry?: Date
  place_of_issue: string
  primary_school?: string
  secondary_school?: string
  higher_education?: string
  diploma: string
  gcc_experience: string
  ksa_experience: string
  local_experience: string
  post_applied_for: string
  referred_by: string
  remarks: string
}

export type CandidateFormFiles = {
  profileImage: boolean
  passportImage: boolean
  cnicFront: boolean
  cnicBack: boolean
  educationalDocument: boolean
  experienceLetter: boolean
  cv: boolean
}

function hasTechnicalQualContent(tq: TechnicalQualInput): boolean {
  return Boolean(
    tq.qualification_name.trim() ||
      tq.institution.trim() ||
      tq.year.trim() ||
      tq.hasCertificate,
  )
}

export function validateCandidateForm(
  form: CandidateFormValues,
  languages: string[],
  technicalQuals: TechnicalQualInput[],
  files: CandidateFormFiles,
): { valid: boolean; message?: string } {
  const requiredText: { label: string; value: string }[] = [
    { label: "Given names", value: form.full_name },
    { label: "Surname", value: form.surname },
    { label: "Father's name", value: form.father_name },
    { label: "Marital status", value: form.marital_status },
    { label: "Religion", value: form.religion },
    { label: "Gender", value: form.sex },
    { label: "CNIC", value: form.citizenship_no },
    { label: "Passport number", value: form.passport_no },
    { label: "Place of issue", value: form.place_of_issue },
    { label: "Post applied for", value: form.post_applied_for },
    { label: "Referred by", value: form.referred_by },
    { label: "Remarks", value: form.remarks },
  ]

  for (const field of requiredText) {
    if (!field.value?.trim()) {
      return { valid: false, message: `${field.label} is required.` }
    }
  }

  if (!form.date_of_birth) return { valid: false, message: "Date of birth is required." }
  if (!form.date_of_issue) return { valid: false, message: "Passport date of issue is required." }
  if (!form.date_of_expiry) return { valid: false, message: "Passport date of expiry is required." }

  if (form.gcc_experience.trim() === "") return { valid: false, message: "GCC experience is required (enter 0 if none)." }
  if (form.ksa_experience.trim() === "") return { valid: false, message: "KSA experience is required (enter 0 if none)." }
  if (form.local_experience.trim() === "") return { valid: false, message: "Local experience is required (enter 0 if none)." }

  if (languages.length === 0) return { valid: false, message: "Add at least one language." }

  const filledTechQuals = technicalQuals.filter(hasTechnicalQualContent)
  for (let i = 0; i < filledTechQuals.length; i++) {
    const tq = filledTechQuals[i]
    const n = i + 1
    if (!tq.qualification_name.trim()) {
      return { valid: false, message: `Technical qualification #${n}: name is required when other details are provided.` }
    }
  }

  const fileChecks: { key: keyof CandidateFormFiles; label: string }[] = [
    { key: "profileImage", label: "Profile image" },
    { key: "passportImage", label: "Passport picture" },
    { key: "cnicFront", label: "CNIC front image" },
    { key: "cnicBack", label: "CNIC back image" },
    { key: "educationalDocument", label: "Educational certificate" },
    { key: "experienceLetter", label: "Experience letter" },
    { key: "cv", label: "CV document" },
  ]

  for (const f of fileChecks) {
    if (!files[f.key]) return { valid: false, message: `${f.label} is required.` }
  }

  return { valid: true }
}

export const ALLOWED_DOC_IMAGE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
] as const

export function validateDocOrImageFile(file: File, maxMb = 5): string | null {
  if (!ALLOWED_DOC_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_DOC_IMAGE_TYPES)[number])) {
    return "Only PDF or image files allowed."
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `File too large (max ${maxMb}MB).`
  }
  return null
}

export function formatDiplomaDetails(name: string, institution: string, year: string): string {
  const parts = [name.trim()]
  if (institution.trim()) parts.push(institution.trim())
  if (year.trim()) parts.push(`(${year.trim()})`)
  return parts.filter(Boolean).join(" — ")
}
