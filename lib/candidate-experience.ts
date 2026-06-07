export function parseExperienceYears(value: string | null | undefined): number {
  const n = parseFloat(String(value || "").trim())
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function formatExperienceYears(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return ""
  return total % 1 === 0 ? String(total) : total.toFixed(1)
}

export function computeExperienceTotal(
  gcc: string | null | undefined,
  ksa: string | null | undefined,
  local: string | null | undefined,
): string {
  const total =
    parseExperienceYears(gcc) + parseExperienceYears(ksa) + parseExperienceYears(local)
  return formatExperienceYears(total)
}

export function sanitizeExperienceInput(value: string): string {
  return value.replace(/[^0-9.]/g, "")
}
