import { pgEnum } from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "receptionist",
  "process_agent",
  "accountant",
])

export const candidateStatusEnum = pgEnum("candidate_status", [
  "active",
  "in_process",
  "completed",
  "rejected",
])

export const workflowStatusEnum = pgEnum("workflow_status", [
  "pending",
  "completed",
  "rejected",
])

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "rejected",
  "refunded",
])

export const paymentTypeEnum = pgEnum("payment_type", [
  "medical",
  "visa",
  "protector",
  "passport",
  "flight",
])

export const interviewTypeEnum = pgEnum("interview_type", [
  "online",
  "in_person",
  "phone",
])

export const interviewStatusEnum = pgEnum("interview_status", [
  "scheduled",
  "completed",
  "cancelled",
  "rescheduled",
])

export const interviewResultEnum = pgEnum("interview_result", [
  "selected",
  "rejected",
  "pending",
])

export const expenseStatusEnum = pgEnum("expense_status", [
  "pending",
  "approved",
  "rejected",
])

export const salaryPaymentStatusEnum = pgEnum("salary_payment_status", [
  "pending",
  "paid",
  "cancelled",
])

export const overallStatusEnum = pgEnum("overall_status", [
  "initiated",
  "in_progress",
  "completed",
  "cancelled",
])


