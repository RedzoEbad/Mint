import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: string
      full_name: string
      phone: string
    }
  }

  interface User {
    id: string
    email: string
    role: string
    full_name: string
    phone: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    full_name: string
    phone: string
  }
}
