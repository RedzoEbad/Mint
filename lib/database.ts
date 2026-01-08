if (typeof window !== "undefined") {
  throw new Error("Database connection cannot be used in browser environment")
}

import { Pool } from "pg"

// Database connection configuration with performance optimizations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  // Connection pool optimizations
  max: Number(process.env.DB_POOL_MAX || 10),
  min: Number(process.env.DB_POOL_MIN || 2),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS || 5000),
  statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 20000),
  query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 20000),
})

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT NOW()")
    client.release()
    // Connection check
    await pool.query("SELECT 1")
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
