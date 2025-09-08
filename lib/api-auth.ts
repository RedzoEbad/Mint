import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-utils"

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: string[],
): Promise<
  | { ok: true; payload: { userId: string; email: string; role: string } }
  | { ok: false; response: NextResponse }
> {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get("authorization")
  let token: string | undefined

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "").trim()
  } else {
    // Fallback to cookie
    const authCookie = request.cookies.get("auth-token")
    token = authCookie?.value?.trim()
  }

  if (!token) {
    return { ok: false, response: NextResponse.json({ success: false, message: "No authentication token provided" }, { status: 401 }) }
  }

  // Additional token validation
  if (token.length === 0) {
    return { ok: false, response: NextResponse.json({ success: false, message: "Empty authentication token" }, { status: 401 }) }
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return { ok: false, response: NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 }) }
  }

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return { ok: false, response: NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 }) }
  }

  return { ok: true, payload: payload as any }
}


