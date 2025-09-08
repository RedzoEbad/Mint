import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    const result = await authenticateUser(email, password)

    if (!result) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    })
    // Set httpOnly auth cookie for session maintenance
    response.cookies.set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    })
    return response
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
