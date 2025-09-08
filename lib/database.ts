if (typeof window !== "undefined") {
  throw new Error("Database connection cannot be used in browser environment")
}

import { Pool } from "pg"

// Database connection configuration with performance optimizations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  // Connection pool optimizations
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  statement_timeout: 10000, // Query timeout of 10 seconds
  query_timeout: 10000, // Query timeout of 10 seconds
})

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT NOW()")
    client.release()
    console.log("Database connected successfully:", result.rows[0])
    return true
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}

// Generic query function
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: result.rowCount })
    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Get a client from the pool for transactions
export async function getClient() {
  return await pool.connect()
}

export default pool
