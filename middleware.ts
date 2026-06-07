import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { logger } from "./lib/logger"
import { routeRoleMap } from "./lib/rbac"
import { getJwtTokenOptions } from "./lib/auth-env"

const protectedRoutes = routeRoleMap

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const baseContext = { path: pathname, method: request.method }

  if (pathname.startsWith("/api/candidates/") && pathname.endsWith("/pdf")) {
    return NextResponse.next()
  }

  const matchedRoute = Object.keys(protectedRoutes)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname.startsWith(route))

  if (!matchedRoute) {
    logger.debug("Middleware: route not protected, allowing", baseContext)
    return NextResponse.next()
  }

  const token = await getToken(getJwtTokenOptions(request))

  if (!token) {
    logger.info("Middleware: no token, redirecting to login", baseContext)
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const normalizeRole = (role: string) => {
    const r = String(role || "").trim().toLowerCase().replace(/\s+/g, "_")
    if (r === "administrator") return "admin"
    if (r === "superadmin" || r === "super_administrator" || r === "superadministrator") return "super_admin"
    return r
  }

  const userRole = normalizeRole(token.role as string)
  const requiredRoles = protectedRoutes[matchedRoute as keyof typeof protectedRoutes]

  if (userRole !== "super_admin" && !requiredRoles.includes(userRole as any)) {
    logger.warn("Middleware: role not permitted", { ...baseContext, userRole, requiredRoles: requiredRoles.join(",") })
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  const response = NextResponse.next()
  response.headers.set("x-user-id", token.sub!)
  response.headers.set("x-user-role", userRole)
  response.headers.set("x-user-email", token.email!)

  logger.debug("Middleware: access granted", { ...baseContext, userId: token.sub, userRole })
  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/files/:path*",
    "/api/candidates/:path*",
    "/api/admin/users/:path*",
    "/api/admin/export/:path*",
    "/api/admin/reports/:path*",
    "/api/users/:path*",
    "/api/workflows/:path*",
    "/api/payments/:path*",
    "/api/reports/:path*",
    "/api/expenses/:path*",
    "/api/salaries/:path*",
  ],
}
