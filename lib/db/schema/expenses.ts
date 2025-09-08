import { pgTable, uuid, varchar, text, decimal, date, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { expenseStatusEnum } from "./enums"
import { users } from "./users"

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


