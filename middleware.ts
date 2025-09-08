import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth-utils"

// Define protected routes and their required roles (strict separation)
const protectedRoutes = {
  "/dashboard": ["super_admin", "admin", "receptionist", "process_agent", "accountant"],
  "/dashboard/admin": ["super_admin"],
  "/dashboard/receptionist": ["receptionist"],
  "/dashboard/agent": ["process_agent"],
  "/dashboard/accounts": ["accountant"],
  "/dashboard/users": ["admin"],
  "/api/candidates": ["receptionist", "process_agent"],
  "/api/users": ["admin"],
  "/api/payments": ["accountant", "process_agent"],
  "/api/reports": ["accountant", "process_agent"],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const matchedRoute = Object.keys(protectedRoutes).find((route) => pathname.startsWith(route))

  if (!matchedRoute) {
    return NextResponse.next()
  }

  // Get token from cookies or Authorization header
  const token = request.cookies.get("auth-token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")

  if (!token) {
    // Redirect to login if no token
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyToken(token)
  if (!payload) {
    // Redirect to login if token is invalid
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role permissions
  const requiredRoles = protectedRoutes[matchedRoute as keyof typeof protectedRoutes]
  if (!requiredRoles.includes(payload.role)) {
    // Redirect to unauthorized page
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  // Add user info to headers for API routes
  const response = NextResponse.next()
  response.headers.set("x-user-id", payload.userId)
  response.headers.set("x-user-role", payload.role)
  response.headers.set("x-user-email", payload.email)

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/candidates/:path*",
    "/api/users/:path*",
    "/api/payments/:path*",
    "/api/reports/:path*",
  ],
}
