import { eq, and } from "drizzle-orm"
import { db, users } from "@/lib/db"
import bcrypt from "bcryptjs"

export interface CreateUserData {
  email: string
  password: string
  role: "super_admin" | "receptionist" | "process_agent" | "accountant"
  fullName: string
  phone?: string
}

export interface UpdateUserData {
  email?: string
  role?: "super_admin" | "receptionist" | "process_agent" | "accountant"
  fullName?: string
  phone?: string
  isActive?: boolean
}

export class UserModel {
  static async create(data: CreateUserData) {
    const passwordHash = await bcrypt.hash(data.password, 10)

    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        role: data.role,
        fullName: data.fullName,
        phone: data.phone,
      })
      .returning()

    return user
  }

  static async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email))
    return user
  }

  static async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id))
    return user
  }

  static async findAll(filters?: { role?: string; isActive?: boolean }) {
    let query = db.select().from(users)

    if (filters?.role || filters?.isActive !== undefined) {
      const conditions = []
      if (filters.role) conditions.push(eq(users.role, filters.role as any))
      if (filters.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive))
      query = query.where(and(...conditions))
    }

    return await query
  }

  static async update(id: string, data: UpdateUserData) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()

    return user
  }

  static async delete(id: string) {
    await db.delete(users).where(eq(users.id, id))
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string) {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }
}
