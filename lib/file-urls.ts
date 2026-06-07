/** Client-safe file URL helpers (no Node.js fs/path imports). */

export function parseStorageKeyFromUrl(fileUrl: string): string | null {
  if (!fileUrl) return null

  const apiMatch = fileUrl.match(/\/api\/files\/([^/]+)\/([^/?#]+)/)
  if (apiMatch) {
    const [, type, name] = apiMatch
    return `${type}/${name}`
  }

  const legacyMatch = fileUrl.match(/\/uploads\/([^/]+)\/([^/?#]+)/)
  if (legacyMatch) {
    const [, type, name] = legacyMatch
    return `${type}/${name}`
  }

  return null
}

/** Normalize DB/file paths for browser and API use. */
export function normalizeStoredFileUrl(fileUrl?: string | null): string | null {
  if (!fileUrl || typeof fileUrl !== "string") return null
  const trimmed = fileUrl.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  if (trimmed.startsWith("/api/files/") || trimmed.startsWith("/uploads/")) return trimmed
  if (trimmed.startsWith("/")) return trimmed
  if (trimmed.includes("/")) return `/api/files/${trimmed}`
  return null
}

export function toAbsoluteFileUrl(origin: string, fileUrl?: string | null): string | null {
  const normalized = normalizeStoredFileUrl(fileUrl)
  if (!normalized) return null
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return normalized
  if (normalized.startsWith("/")) return `${origin}${normalized}`
  return `${origin}/${normalized}`
}
