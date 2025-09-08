import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth-utils"
import { logger } from "./lib/logger"

// Define protected routes and their required roles (strict separation)
const protectedRoutes = {
  "/dashboard": ["super_admin", "admin", "receptionist", "process_agent", "accountant"],
  "/dashboard/admin/users": ["super_admin", "admin"],
  "/dashboard/admin": ["super_admin"],
  "/dashboard/receptionist": ["receptionist"],
  "/dashboard/agent": ["process_agent"],
  "/dashboard/accounts": ["accountant"],
  "/dashboard/users": ["super_admin", "admin"],
  "/api/candidates": ["super_admin", "admin", "receptionist", "process_agent"],
  "/api/admin/users": ["super_admin", "admin"],
  "/api/users": ["super_admin","admin"],
  "/api/payments": ["accountant", "process_agent"],
  "/api/reports": ["accountant", "process_agent"],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const baseContext = { path: pathname, method: request.method }

  // Skip auth checks for PDF generation endpoint to avoid heavy work and nested fetches
  if (pathname.startsWith("/api/candidates/") && pathname.endsWith("/pdf")) {
    return NextResponse.next()
  }

  // Check if the route is protected (prefer the most specific match)
  const matchedRoute = Object.keys(protectedRoutes)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname.startsWith(route))

  if (!matchedRoute) {
    logger.debug("Middleware: route not protected, allowing", baseContext)
    return NextResponse.next()
  }

  // Get token from cookies or Authorization header
  const token = request.cookies.get("auth-token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")

  if (!token) {
    logger.info("Middleware: no token, redirecting to login", baseContext)
    // Redirect to login if no token
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyToken(token)
  if (!payload) {
    logger.info("Middleware: invalid token, redirecting to login", baseContext)
    // Redirect to login if token is invalid
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Normalize role to avoid case or formatting mismatches
  const normalizeRole = (role: string) => {
    const r = String(role || "").trim().toLowerCase().replace(/\s+/g, "_")
    if (r === "administrator") return "admin"
    if (r === "superadmin" || r === "super_administrator" || r === "superadministrator") return "super_admin"
    return r
  }

  const userRole = normalizeRole(payload.role)

  // Check role permissions
  const requiredRoles = protectedRoutes[matchedRoute as keyof typeof protectedRoutes]
  if (!requiredRoles.includes(userRole)) {
    logger.warn("Middleware: role not permitted", { ...baseContext, userRole, requiredRoles: requiredRoles.join(",") })
    // Redirect to unauthorized page
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  // Add user info to headers for API routes
  const response = NextResponse.next()
  response.headers.set("x-user-id", payload.userId)
  response.headers.set("x-user-role", userRole)
  response.headers.set("x-user-email", payload.email)

  logger.debug("Middleware: access granted", { ...baseContext, userId: payload.userId, userRole })
  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/candidates/:path*",
    "/api/admin/users/:path*",
    "/api/users/:path*",
    "/api/payments/:path*",
    "/api/reports/:path*",
  ],
}
