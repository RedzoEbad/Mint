// Minimal Postgres init script: seeds first super_admin user if missing
// Requires: process.env.DATABASE_URL
const { Client } = require('pg')
const bcrypt = require('bcryptjs')

async function run() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    await client.query('BEGIN')

    // Ensure uuid extension (matches schema script usage)
    try { await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";') } catch {}

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mintinternational.org'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const adminRole = 'super_admin'

    const { rows } = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail])
    if (rows.length === 0) {
      const hash = await bcrypt.hash(adminPassword, 12)
      await client.query(
        `INSERT INTO users (email, password_hash, role, full_name, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [adminEmail, hash, adminRole, 'System Administrator']
      )
      console.log(`Seeded admin user: ${adminEmail}`)
    } else {
      console.log('Admin user already exists')
    }

    // Seed additional demo accounts for dashboards if missing
    const demoUsers = [
      {
        email: process.env.RECEPTIONIST_EMAIL || 'receptionist@mintinternational.org',
        password: process.env.RECEPTIONIST_PASSWORD || 'receptionist123',
        role: 'receptionist',
        fullName: 'Reception Desk',
      },
      {
        email: process.env.AGENT_EMAIL || 'agent@mintinternational.org',
        password: process.env.AGENT_PASSWORD || 'agent123',
        role: 'process_agent',
        fullName: 'Process Agent',
      },
      {
        email: process.env.ACCOUNTS_EMAIL || 'accounts@mintinternational.org',
        password: process.env.ACCOUNTS_PASSWORD || 'accounts123',
        role: 'accountant',
        fullName: 'Accounts Team',
      },
    ]

    for (const u of demoUsers) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [u.email])
      if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(u.password, 12)
        await client.query(
          `INSERT INTO users (email, password_hash, role, full_name, is_active)
           VALUES ($1, $2, $3, $4, true)`,
          [u.email, hash, u.role, u.fullName]
        )
        console.log(`Seeded ${u.role}: ${u.email}`)
      }
    }

    await client.query('COMMIT')
    console.log('Database initialized')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('DB init failed:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

run()


