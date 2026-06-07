import type { NextRequest } from "next/server"

export function getAuthSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "mint-international-secret-key-2024"
}

/** Canonical app URL for NextAuth (required on Vercel). */
export function getAuthBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "http://localhost:3000"
}

/**
 * On HTTPS (Vercel), NextAuth uses the __Secure- cookie prefix.
 * getToken() must use the same setting or middleware always sees "logged out".
 */
export function shouldUseSecureCookies(request?: NextRequest): boolean {
  if (process.env.NEXTAUTH_URL?.startsWith("https://")) return true
  if (process.env.VERCEL) return true
  if (request?.nextUrl.protocol === "https:") return true
  return false
}

export function getJwtTokenOptions(request: NextRequest) {
  return {
    req: request,
    secret: getAuthSecret(),
    secureCookie: shouldUseSecureCookies(request),
  }
}
