import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { candidates } from "./candidates"

export const experienceDetails = pgTable("experience_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  duration: varchar("duration", { length: 100 }),
  trade: varchar("trade", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
})

export const experienceDetailsRelations = relations(experienceDetails, ({ one }) => ({
  candidate: one(candidates, {
    fields: [experienceDetails.candidateId],
    references: [candidates.id],
  }),
}))


