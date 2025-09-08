import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

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

export const companiesRelations = relations(companies, () => ({}))


