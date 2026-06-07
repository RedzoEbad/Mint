import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { getJwtTokenOptions } from "@/lib/auth-env"

export async function getAuthToken(request: NextRequest) {
  return getToken(getJwtTokenOptions(request))
}
