import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"

const PRIVATE_BASE_DIR = path.join(process.cwd(), "storage", "uploads")
const LEGACY_PUBLIC_DIR = path.join(process.cwd(), "public", "uploads")

const ALLOWED_TYPES = new Set([
  "profile-images",
  "cnic-images",
  "certificates",
  "experience-letters",
  "cv-docs",
])

export function sanitizeUploadType(type: string): string {
  const safe = type.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase()
  if (!ALLOWED_TYPES.has(safe)) {
    throw new Error(`Invalid upload type: ${type}`)
  }
  return safe
}

export async function ensureUploadDir(type: string) {
  const safe = sanitizeUploadType(type)
  const dir = path.join(PRIVATE_BASE_DIR, safe)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export async function saveFile(
  type: string,
  file: File,
): Promise<{ url: string; filepath: string; filename: string; storageKey: string }> {
  const safe = sanitizeUploadType(type)
  const dir = await ensureUploadDir(safe)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = path.extname(file.name).toLowerCase() || ""
  const filename = `${randomUUID()}${ext}`
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, buffer)
  const storageKey = `${safe}/${filename}`
  const url = `/api/files/${storageKey}`
  return { url, filepath, filename, storageKey }
}

/** Resolve a stored file URL or legacy public path to an on-disk path. */
export async function resolveStoredFilePath(fileUrl: string): Promise<string | null> {
  if (!fileUrl) return null

  // New secured route: /api/files/{type}/{filename}
  const apiMatch = fileUrl.match(/\/api\/files\/([^/]+)\/([^/?#]+)/)
  if (apiMatch) {
    const [, type, name] = apiMatch
    const candidate = path.join(PRIVATE_BASE_DIR, type, name)
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      return null
    }
  }

  // Legacy public URL: /uploads/{type}/{filename}
  const legacyMatch = fileUrl.match(/\/uploads\/([^/]+)\/([^/?#]+)/)
  if (legacyMatch) {
    const [, type, name] = legacyMatch
    const legacyPath = path.join(LEGACY_PUBLIC_DIR, type, name)
    try {
      await fs.access(legacyPath)
      return legacyPath
    } catch {
      return null
    }
  }

  return null
}

export function toAbsoluteFileUrl(origin: string, fileUrl?: string | null): string | null {
  if (!fileUrl) return null
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl
  if (fileUrl.startsWith("/")) return `${origin}${fileUrl}`
  return `${origin}/${fileUrl}`
}
