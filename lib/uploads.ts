import { promises as fs } from "fs"
import path from "path"

const BASE_DIR = path.join(process.cwd(), "public", "uploads")

export async function ensureUploadDir(type: string) {
  const safe = type.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase()
  const dir = path.join(BASE_DIR, safe)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export async function saveFile(type: string, file: File): Promise<{ url: string; filepath: string; filename: string }> {
  const dir = await ensureUploadDir(type)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = path.extname(file.name) || ""
  const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase()
  const stamp = Date.now()
  const filename = `${base || "file"}-${stamp}${ext}`
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, buffer)
  const url = `/uploads/${type}/${filename}`
  return { url, filepath, filename }
}
