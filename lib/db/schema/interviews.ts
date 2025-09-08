import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { interviewTypeEnum, interviewStatusEnum, interviewResultEnum } from "./enums"
import { candidates } from "./candidates"
import { companies } from "./companies"
import { users } from "./users"

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  interviewType: interviewTypeEnum("interview_type"),
  interviewDate: timestamp("interview_date"),
  interviewStatus: interviewStatusEnum("interview_status").default("scheduled"),
  feedback: text("feedback"),
  result: interviewResultEnum("result"),
  conductedBy: uuid("conducted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const interviewsRelations = relations(interviews, ({ one }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  company: one(companies, {
    fields: [interviews.companyId],
    references: [companies.id],
  }),
  conductedBy: one(users, {
    fields: [interviews.conductedBy],
    references: [users.id],
  }),
}))


