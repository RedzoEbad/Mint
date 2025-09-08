import { pgTable, uuid, decimal, date, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"
import { salaryPaymentStatusEnum } from "./enums"

export const salaries = pgTable("salaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
