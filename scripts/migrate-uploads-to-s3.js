/**
 * Upload local files from storage/uploads and public/uploads to S3.
 *
 * Requires in .env.local:
 *   AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   AWS_S3_PREFIX (optional)
 *
 * Usage: node scripts/migrate-uploads-to-s3.js
 *        node scripts/migrate-uploads-to-s3.js --dry-run
 */
require("dotenv").config({ path: ".env.local" })

const fs = require("fs")
const path = require("path")
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3")

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

const ROOT = process.cwd()
const SOURCE_DIRS = [
  path.join(ROOT, "storage", "uploads"),
  path.join(ROOT, "public", "uploads"),
]

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing ${name} in .env.local`)
    process.exit(1)
  }
  return value
}

function getS3ObjectKey(storageKey) {
  const prefix = (process.env.AWS_S3_PREFIX || "").replace(/^\/+|\/+$/g, "")
  return prefix ? `${prefix}/${storageKey}` : storageKey
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return MIME[ext] || "application/octet-stream"
}

function collectFiles(baseDir, currentDir = baseDir) {
  if (!fs.existsSync(currentDir)) return []

  const results = []
  const entries = fs.readdirSync(currentDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(baseDir, fullPath))
    } else if (entry.isFile()) {
      const storageKey = path.relative(baseDir, fullPath).split(path.sep).join("/")
      results.push({ fullPath, storageKey, sourceRoot: baseDir })
    }
  }
  return results
}

async function objectExists(client, bucket, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
      return false
    }
    if (error?.$metadata?.httpStatusCode === 403) {
      // Some IAM policies allow GetObject but not HeadObject — treat as missing.
      return false
    }
    throw error
  }
}

function formatAwsError(error) {
  const parts = [error?.name, error?.message].filter(Boolean)
  if (error?.$metadata?.httpStatusCode) {
    parts.push(`status=${error.$metadata.httpStatusCode}`)
  }
  return parts.join(" | ") || String(error)
}

async function run() {
  const dryRun = process.argv.includes("--dry-run")
  const bucket = requiredEnv("AWS_S3_BUCKET")
  requiredEnv("AWS_REGION")
  requiredEnv("AWS_ACCESS_KEY_ID")
  requiredEnv("AWS_SECRET_ACCESS_KEY")

  const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })

  const seen = new Set()
  const files = []
  for (const dir of SOURCE_DIRS) {
    for (const file of collectFiles(dir)) {
      if (!seen.has(file.storageKey)) {
        seen.add(file.storageKey)
        files.push(file)
      }
    }
  }

  if (files.length === 0) {
    console.log("No local upload files found in storage/uploads or public/uploads.")
    return
  }

  console.log(`Found ${files.length} file(s) to migrate${dryRun ? " (dry run)" : ""}.`)
  console.log(`Bucket: ${bucket}`)
  if (process.env.AWS_S3_PREFIX) {
    console.log(`Prefix: ${process.env.AWS_S3_PREFIX}`)
  }

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const file of files) {
    const s3Key = getS3ObjectKey(file.storageKey)
    const label = `${file.storageKey} -> s3://${bucket}/${s3Key}`

    try {
      const exists = await objectExists(client, bucket, s3Key)
      if (exists) {
        console.log(`SKIP (already in S3): ${label}`)
        skipped++
        continue
      }

      if (dryRun) {
        console.log(`WOULD UPLOAD: ${label}`)
        uploaded++
        continue
      }

      const body = fs.readFileSync(file.fullPath)
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: body,
          ContentType: contentTypeFor(file.fullPath),
        }),
      )
      console.log(`UPLOADED: ${label}`)
      uploaded++
    } catch (error) {
      console.error(`FAILED: ${label}`)
      console.error(formatAwsError(error))
      failed++
    }
  }

  console.log("")
  console.log(`Done. uploaded=${uploaded} skipped=${skipped} failed=${failed}`)
  if (failed > 0) process.exit(1)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
