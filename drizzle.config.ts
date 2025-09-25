import type { Config } from "drizzle-kit"
import { config } from "dotenv"

// Load environment variables from .env.local
config({ path: ".env.local" })

export default {
  // Use the generated Drizzle schema for tooling; runtime also imports from drizzle/schema
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
