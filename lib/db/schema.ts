import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  date,
  decimal,
  jsonb,
  inet,
  pgEnum,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const userRoleEnum = pgEnum("user_role", ["super_admin", "receptionist", "process_agent", "accountant"])
export const candidateStatusEnum = pgEnum("candidate_status", ["active", "in_process", "completed", "rejected"])
export const workflowStatusEnum = pgEnum("workflow_status", ["pending", "completed", "rejected"])
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "rejected", "refunded"])
export const paymentTypeEnum = pgEnum("payment_type", ["medical", "visa", "protector", "passport", "flight"])
export const interviewTypeEnum = pgEnum("interview_type", ["online", "in_person", "phone"])
export const interviewStatusEnum = pgEnum("interview_status", ["scheduled", "completed", "cancelled", "rescheduled"])
export const interviewResultEnum = pgEnum("interview_result", ["selected", "rejected", "pending"])
export const expenseStatusEnum = pgEnum("expense_status", ["pending", "approved", "rejected"])
export const salaryPaymentStatusEnum = pgEnum("salary_payment_status", ["pending", "paid", "cancelled"])
export const overallStatusEnum = pgEnum("overall_status", ["initiated", "in_progress", "completed", "cancelled"])

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    roleIdx: index("idx_users_role").on(table.role),
  }),
)

// Companies table
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  country: varchar("country", { length: 100 }),
  requirements: text("requirements"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Candidates table
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

// Experience details table
export const experienceDetails = pgTable("experience_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  duration: varchar("duration", { length: 100 }),
  trade: varchar("trade", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
})

// Workflow stages table
export const workflowStages = pgTable(
  "workflow_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .references(() => candidates.id, { onDelete: "cascade" })
      .notNull(),
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

// Payments table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .references(() => candidates.id, { onDelete: "cascade" })
      .notNull(),
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

// Interviews table
export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
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

// Expenses table
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR"),
  expenseDate: date("expense_date").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  status: expenseStatusEnum("status").default("pending"),
  receiptFile: varchar("receipt_file", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Salaries table
export const salaries = pgTable("salaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 10, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  salaryMonth: date("salary_month").notNull(),
  paymentStatus: salaryPaymentStatusEnum("payment_status").default("pending"),
  paymentDate: timestamp("payment_date"),
  processedBy: uuid("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Audit logs table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    action: varchar("action", { length: 255 }).notNull(),
    tableName: varchar("table_name", { length: 100 }),
    recordId: uuid("record_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_audit_logs_user_id").on(table.userId),
    createdAtIdx: index("idx_audit_logs_created_at").on(table.createdAt),
  }),
)

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  candidatesCreated: many(candidates),
  workflowsAssigned: many(workflowStages),
  paymentsVerified: many(payments),
  interviewsConducted: many(interviews),
  expensesCreated: many(expenses),
  expensesApproved: many(expenses),
  salaries: many(salaries),
  auditLogs: many(auditLogs),
}))

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [candidates.createdBy],
    references: [users.id],
  }),
  experienceDetails: many(experienceDetails),
  workflowStages: many(workflowStages),
  payments: many(payments),
  interviews: many(interviews),
}))

export const companiesRelations = relations(companies, ({ many }) => ({
  workflowStages: many(workflowStages),
  interviews: many(interviews),
}))

export const workflowStagesRelations = relations(workflowStages, ({ one, many }) => ({
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
  payments: many(payments),
}))

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

export const experienceDetailsRelations = relations(experienceDetails, ({ one }) => ({
  candidate: one(candidates, {
    fields: [experienceDetails.candidateId],
    references: [candidates.id],
  }),
}))

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

export const expensesRelations = relations(expenses, ({ one }) => ({
  createdBy: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [expenses.approvedBy],
    references: [users.id],
  }),
}))

export const salariesRelations = relations(salaries, ({ one }) => ({
  user: one(users, {
    fields: [salaries.userId],
    references: [users.id],
  }),
  processedBy: one(users, {
    fields: [salaries.processedBy],
    references: [users.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))
