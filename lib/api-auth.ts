import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { getJwtTokenOptions } from "@/lib/auth-env"

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: string[],
): Promise<
  | { ok: true; payload: { userId: string; email: string; role: string; full_name: string; phone: string } }
  | { ok: false; response: NextResponse }
> {
  // Get token using NextAuth
  const token = await getToken(getJwtTokenOptions(request))

  if (!token) {
    return { ok: false, response: NextResponse.json({ success: false, message: "No authentication token provided" }, { status: 401 }) }
  }

  if (allowedRoles && !allowedRoles.includes(token.role as string)) {
    return { ok: false, response: NextResponse.json({ success: false, message: "Insufficient permissions" }, { status: 403 }) }
  }

  return { 
    ok: true, 
    payload: {
      userId: token.sub!,
      email: token.email!,
      role: token.role as string,
      full_name: token.full_name as string,
      phone: token.phone as string
    }
  }
}
