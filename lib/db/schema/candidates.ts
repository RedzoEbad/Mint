import { pgTable, uuid, varchar, text, date, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { candidateStatusEnum } from "./enums"
import { users } from "./users"

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    fatherName: varchar("father_name", { length: 255 }),
    dateOfBirth: date("date_of_birth"),
    maritalStatus: varchar("marital_status", { length: 50 }),
    religion: varchar("religion", { length: 100 }),
    passportNo: varchar("passport_no", { length: 50 }).unique(),
    dateOfIssue: date("date_of_issue"),
    dateOfExpiry: date("date_of_expiry"),
    placeOfIssue: varchar("place_of_issue", { length: 255 }),
    academicQualifications: text("academic_qualifications"),
    technicalQualifications: text("technical_qualifications"),
    languagesKnown: text("languages_known").array(),
    experienceTotal: varchar("experience_total", { length: 50 }),
    postAppliedFor: varchar("post_applied_for", { length: 255 }),
    referredBy: varchar("referred_by", { length: 255 }),
    profileImage: varchar("profile_image", { length: 500 }),
    cvFile: varchar("cv_file", { length: 500 }),
    remarks: text("remarks"),
    status: candidateStatusEnum("status").default("active"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    statusIdx: index("idx_candidates_status").on(table.status),
    createdByIdx: index("idx_candidates_created_by").on(table.createdBy),
  }),
)

export const candidatesRelations = relations(candidates, () => ({}))
