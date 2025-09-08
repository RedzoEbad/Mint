import { pgTable, uuid, varchar, decimal, timestamp, text, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { paymentStatusEnum, paymentTypeEnum } from "./enums"
import { candidates } from "./candidates"
import { workflowStages } from "./workflows"
import { users } from "./users"

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
    workflowId: uuid("workflow_id").references(() => workflowStages.id, { onDelete: "cascade" }),
    paymentType: paymentTypeEnum("payment_type").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("SAR"),
    paymentStatus: paymentStatusEnum("payment_status").default("pending"),
    paymentMethod: varchar("payment_method", { length: 50 }),
    transactionId: varchar("transaction_id", { length: 255 }),
    paymentDate: timestamp("payment_date"),
    verifiedBy: uuid("verified_by").references(() => users.id),
    verificationDate: timestamp("verification_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    candidateIdx: index("idx_payments_candidate_id").on(table.candidateId),
    statusIdx: index("idx_payments_status").on(table.paymentStatus),
  }),
)

export const paymentsRelations = relations(payments, ({ one }) => ({
  candidate: one(candidates, {
    fields: [payments.candidateId],
    references: [candidates.id],
  }),
  workflow: one(workflowStages, {
    fields: [payments.workflowId],
    references: [workflowStages.id],
  }),
  verifiedBy: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id],
  }),
}))
