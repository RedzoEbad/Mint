if (typeof window !== "undefined") {
  throw new Error("Database connection cannot be used in browser environment")
}

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Create Drizzle database instance
export const db = drizzle(pool, { schema })

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect()
    // Connection check
    await pool.query("SELECT 1")
    return pool
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}

// Export schema for use in other files
export * from "./schema"

export default db
