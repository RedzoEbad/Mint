import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { query } from "@/lib/database"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const result = await query(
            "SELECT id, email, password_hash, role, full_name, phone, is_active FROM users WHERE email = $1 LIMIT 1",
            [credentials.email]
          )

          if (!result.rows.length || !result.rows[0].is_active) {
            return null
          }

          const userData = result.rows[0]

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            userData.password_hash
          )

          if (!isValidPassword) {
            return null
          }

          return {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            full_name: userData.full_name,
            phone: userData.phone
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.full_name = user.full_name
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.full_name = token.full_name as string
        session.user.phone = token.phone as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized"
  },
  secret: process.env.NEXTAUTH_SECRET || "mint-international-secret-key-2024"
}
