import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

let s3Client: S3Client | null = null

export function isS3StorageEnabled(): boolean {
  return Boolean(
    process.env.AWS_S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION,
  )
}

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  }
  return s3Client
}

export function getS3ObjectKey(storageKey: string): string {
  const prefix = (process.env.AWS_S3_PREFIX || "").replace(/^\/+|\/+$/g, "")
  return prefix ? `${prefix}/${storageKey}` : storageKey
}

export async function putS3Object(
  storageKey: string,
  body: Buffer,
  contentType?: string,
): Promise<void> {
  const bucket = process.env.AWS_S3_BUCKET!
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: getS3ObjectKey(storageKey),
      Body: body,
      ContentType: contentType || "application/octet-stream",
    }),
  )
}

export async function getS3Object(
  storageKey: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const bucket = process.env.AWS_S3_BUCKET!
  try {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: getS3ObjectKey(storageKey),
      }),
    )
    if (!response.Body) return null
    const bytes = await response.Body.transformToByteArray()
    return {
      buffer: Buffer.from(bytes),
      contentType: response.ContentType || "application/octet-stream",
    }
  } catch (error: any) {
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      return null
    }
    throw error
  }
}
