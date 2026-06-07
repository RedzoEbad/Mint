"use client"

import { useEffect, useState } from "react"
import { normalizeStoredFileUrl } from "@/lib/uploads"

export function SecureImage({
  src,
  alt,
  className,
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null)

  useEffect(() => {
    const url = normalizeStoredFileUrl(src)
    if (!url) {
      setResolvedSrc(null)
      return
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      setResolvedSrc(url)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(url, { credentials: "include" })
        if (!res.ok) {
          if (!cancelled) setResolvedSrc(null)
          return
        }
        const blob = await res.blob()
        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) setResolvedSrc(objectUrl)
      } catch {
        if (!cancelled) setResolvedSrc(null)
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  if (!resolvedSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-xs text-gray-500 ${className || ""}`.trim()}>
        Image unavailable
      </div>
    )
  }

  return <img src={resolvedSrc} alt={alt} className={className} />
}

export function SecureFileLink({
  url,
  label,
  className,
}: {
  url?: string | null
  label: string
  className?: string
}) {
  const normalized = normalizeStoredFileUrl(url)

  if (!normalized) {
    return <div className="text-sm text-gray-400">-</div>
  }

  return (
    <a
      href={normalized}
      target="_blank"
      rel="noreferrer"
      className={className || "text-sm text-blue-600 underline"}
    >
      {label}
    </a>
  )
}
