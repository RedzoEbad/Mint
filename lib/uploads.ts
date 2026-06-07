import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import { parseStorageKeyFromUrl } from "@/lib/file-urls"
import { getS3Object, isS3StorageEnabled, putS3Object } from "@/lib/s3-storage"

const PRIVATE_BASE_DIR = path.join(process.cwd(), "storage", "uploads")
const LEGACY_PUBLIC_DIR = path.join(process.cwd(), "public", "uploads")

const ALLOWED_TYPES = new Set([
  "profile-images",
  "cnic-images",
  "certificates",
  "experience-letters",
  "cv-docs",
  "expense-receipts",
])

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

export function sanitizeUploadType(type: string): string {
  const safe = type.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase()
  if (!ALLOWED_TYPES.has(safe)) {
    throw new Error(`Invalid upload type: ${type}`)
  }
  return safe
}

function contentTypeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return MIME[ext] || "application/octet-stream"
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
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = path.extname(file.name).toLowerCase() || ""
  const filename = `${randomUUID()}${ext}`
  const storageKey = `${safe}/${filename}`
  const url = `/api/files/${storageKey}`
  const contentType = file.type || contentTypeFromFilename(filename)

  if (isS3StorageEnabled()) {
    await putS3Object(storageKey, buffer, contentType)
    return { url, filepath: storageKey, filename, storageKey }
  }

  const dir = await ensureUploadDir(safe)
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, buffer)
  return { url, filepath, filename, storageKey }
}

/** Resolve a stored file URL or legacy public path to an on-disk path. */
export async function resolveStoredFilePath(fileUrl: string): Promise<string | null> {
  if (!fileUrl || isS3StorageEnabled()) return null

  const storageKey = parseStorageKeyFromUrl(fileUrl)
  if (!storageKey) return null

  const [type, name] = storageKey.split("/")
  const candidate = path.join(PRIVATE_BASE_DIR, type, name)
  try {
    await fs.access(candidate)
    return candidate
  } catch {
    // fall through to legacy public path
  }

  const legacyPath = path.join(LEGACY_PUBLIC_DIR, type, name)
  try {
    await fs.access(legacyPath)
    return legacyPath
  } catch {
    return null
  }
}

export async function readStoredFile(
  fileUrl: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const storageKey = parseStorageKeyFromUrl(fileUrl)
  if (!storageKey) return null

  if (isS3StorageEnabled()) {
    const fromS3 = await getS3Object(storageKey)
    if (fromS3) return fromS3
  }

  const filepath = await resolveStoredFilePath(fileUrl)
  if (!filepath) return null

  const buffer = await fs.readFile(filepath)
  return {
    buffer,
    contentType: contentTypeFromFilename(filepath),
  }
}

