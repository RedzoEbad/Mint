import { eq, and, ilike, or, desc } from "drizzle-orm"
import { db, candidates, users } from "@/lib/db"

export interface CreateCandidateData {
  fullName: string
  fatherName?: string
  dateOfBirth?: string
  maritalStatus?: string
  religion?: string
  passportNo?: string
  dateOfIssue?: string
  dateOfExpiry?: string
  placeOfIssue?: string
  academicQualifications?: string
  technicalQualifications?: string
  languagesKnown?: string[]
  experienceTotal?: string
  postAppliedFor?: string
  referredBy?: string
  profileImage?: string
  cvFile?: string
  remarks?: string
  createdBy: string
}

export interface UpdateCandidateData {
  fullName?: string
  fatherName?: string
  dateOfBirth?: string
  maritalStatus?: string
  religion?: string
  passportNo?: string
  dateOfIssue?: string
  dateOfExpiry?: string
  placeOfIssue?: string
  academicQualifications?: string
  technicalQualifications?: string
  languagesKnown?: string[]
  experienceTotal?: string
  postAppliedFor?: string
  referredBy?: string
  profileImage?: string
  cvFile?: string
  remarks?: string
  status?: "active" | "in_process" | "completed" | "rejected"
}

export interface CandidateFilters {
  search?: string
  status?: string
  postAppliedFor?: string
  createdBy?: string
}

export class CandidateModel {
  static async create(data: CreateCandidateData) {
    const [candidate] = await db
      .insert(candidates)
      .values({
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        dateOfIssue: data.dateOfIssue ? new Date(data.dateOfIssue) : undefined,
        dateOfExpiry: data.dateOfExpiry ? new Date(data.dateOfExpiry) : undefined,
      })
      .returning()

    return candidate
  }

  static async findById(id: string) {
    const [candidate] = await db
      .select({
        candidate: candidates,
        createdBy: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(candidates)
      .leftJoin(users, eq(candidates.createdBy, users.id))
      .where(eq(candidates.id, id))

    return candidate
  }

  static async findAll(filters?: CandidateFilters, limit = 50, offset = 0) {
    let query = db
      .select({
        candidate: candidates,
        createdBy: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(candidates)
      .leftJoin(users, eq(candidates.createdBy, users.id))
      .orderBy(desc(candidates.createdAt))
      .limit(limit)
      .offset(offset)

    if (filters) {
      const conditions = []

      if (filters.search) {
        conditions.push(
          or(
            ilike(candidates.fullName, `%${filters.search}%`),
            ilike(candidates.passportNo, `%${filters.search}%`),
            ilike(candidates.postAppliedFor, `%${filters.search}%`),
          ),
        )
      }

      if (filters.status) {
        conditions.push(eq(candidates.status, filters.status as any))
      }

      if (filters.postAppliedFor) {
        conditions.push(ilike(candidates.postAppliedFor, `%${filters.postAppliedFor}%`))
      }

      if (filters.createdBy) {
        conditions.push(eq(candidates.createdBy, filters.createdBy))
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions))
      }
    }

    return await query
  }

  static async update(id: string, data: UpdateCandidateData) {
    const [candidate] = await db
      .update(candidates)
      .set({
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        dateOfIssue: data.dateOfIssue ? new Date(data.dateOfIssue) : undefined,
        dateOfExpiry: data.dateOfExpiry ? new Date(data.dateOfExpiry) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id))
      .returning()

    return candidate
  }

  static async delete(id: string) {
    await db.delete(candidates).where(eq(candidates.id, id))
  }

  static async getStats() {
    const totalCandidates = await db.select().from(candidates)
    const activeCandidates = await db.select().from(candidates).where(eq(candidates.status, "active"))
    const inProcessCandidates = await db.select().from(candidates).where(eq(candidates.status, "in_process"))
    const completedCandidates = await db.select().from(candidates).where(eq(candidates.status, "completed"))

    return {
      total: totalCandidates.length,
      active: activeCandidates.length,
      inProcess: inProcessCandidates.length,
      completed: completedCandidates.length,
    }
  }
}
