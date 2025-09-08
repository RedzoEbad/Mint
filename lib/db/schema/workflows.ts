import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { workflowStatusEnum, paymentStatusEnum, overallStatusEnum } from "./enums"
import { candidates } from "./candidates"
import { companies } from "./companies"
import { users } from "./users"

export const workflowStages = pgTable(
  "workflow_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
    companyId: uuid("company_id").references(() => companies.id),
    medicalStatus: workflowStatusEnum("medical_status").default("pending"),
    medicalPaymentStatus: paymentStatusEnum("medical_payment_status").default("pending"),
    visaStatus: workflowStatusEnum("visa_status").default("pending"),
    visaPaymentStatus: paymentStatusEnum("visa_payment_status").default("pending"),
    protectorStatus: workflowStatusEnum("protector_status").default("pending"),
    protectorPaymentStatus: paymentStatusEnum("protector_payment_status").default("pending"),
    passportStatus: workflowStatusEnum("passport_status").default("pending"),
    passportPaymentStatus: paymentStatusEnum("passport_payment_status").default("pending"),
    flightStatus: workflowStatusEnum("flight_status").default("pending"),
    flightPaymentStatus: paymentStatusEnum("flight_payment_status").default("pending"),
    overallStatus: overallStatusEnum("overall_status").default("initiated"),
    assignedAgent: uuid("assigned_agent").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    candidateIdx: index("idx_workflow_stages_candidate_id").on(table.candidateId),
    agentIdx: index("idx_workflow_stages_assigned_agent").on(table.assignedAgent),
  }),
)

export const workflowStagesRelations = relations(workflowStages, ({ one }) => ({
  candidate: one(candidates, {
    fields: [workflowStages.candidateId],
    references: [candidates.id],
  }),
  company: one(companies, {
    fields: [workflowStages.companyId],
    references: [companies.id],
  }),
  assignedAgent: one(users, {
    fields: [workflowStages.assignedAgent],
    references: [users.id],
  }),
}))
