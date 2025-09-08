import { pgTable, uuid, varchar, jsonb, inet, text, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

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

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))


