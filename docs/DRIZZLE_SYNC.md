# Drizzle Schema Sync Guide

This guide explains how to sync your Drizzle schema changes with the database using the automated scripts.

## 🚀 Quick Start

### Full Schema Sync (Recommended)
```bash
npm run db:sync:smart
```
This command will:
1. Generate migrations from schema changes
2. Apply migrations to the database
3. Provide detailed feedback on the process

### Basic Sync Commands

```bash
# Generate migrations only
npm run db:generate

# Push migrations only  
npm run db:push

# Simple sync (generate + push)
npm run db:sync

# Open Drizzle Studio
npm run db:studio

# Run migrations programmatically
npm run db:migrate
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate SQL migrations from schema changes |
| `npm run db:push` | Apply migrations to database |
| `npm run db:sync` | Generate + push migrations (basic) |
| `npm run db:sync:smart` | Smart sync with detailed feedback |
| `npm run db:studio` | Open Drizzle Studio for database management |
| `npm run db:migrate` | Run migrations programmatically |

## 🔧 Smart Sync Features

The `db:sync:smart` command provides:

- ✅ **Automatic migration generation** from schema changes
- ✅ **Migration validation** before applying
- ✅ **Detailed progress feedback** with colored output
- ✅ **Error handling** with clear error messages
- ✅ **Migration file listing** to show what's being applied
- ✅ **Safe execution** with proper error handling

## 🛠️ Manual Commands

You can also use the sync script directly with specific commands:

```bash
# Full sync
node scripts/sync-schema.js

# Generate only
node scripts/sync-schema.js generate

# Push only
node scripts/sync-schema.js push

# Open studio
node scripts/sync-schema.js studio

# Show help
node scripts/sync-schema.js help
```

## 🔄 Development Workflow

1. **Make schema changes** in your Drizzle schema files
2. **Run sync command**: `npm run db:sync:smart`
3. **Review generated migrations** (if any)
4. **Migrations are applied automatically** to your database
5. **Continue development** with updated schema

## 🚨 Important Notes

- **Always backup your database** before running migrations in production
- **Review generated SQL** before applying in production
- **Test migrations** in a development environment first
- **Use `db:studio`** to inspect your database structure
- **Migrations are stored** in the `drizzle/` folder

## 🐛 Troubleshooting

### Migration Generation Fails
- Check your `drizzle.config.ts` configuration
- Ensure schema files are properly imported
- Verify database connection settings

### Migration Push Fails
- Check database connection
- Ensure you have proper permissions
- Review error messages for specific issues

### Schema Sync Issues
- Run `npm run db:studio` to inspect current database state
- Check migration files in `drizzle/` folder
- Verify schema definitions match your requirements

## 📁 File Structure

```
scripts/
├── sync-schema.js     # Smart sync script
├── migrate-db.js      # Programmatic migration runner
└── init-db.js         # Database initialization

drizzle/
├── 0000_*.sql         # Generated migration files
└── meta/              # Migration metadata

drizzle.config.ts      # Drizzle configuration
```

## 🔐 Environment Variables

Make sure these environment variables are set:

```env
DATABASE_URL=your_database_connection_string
NODE_ENV=development|production
```

## 🎯 Best Practices

1. **Use smart sync for development**: `npm run db:sync:smart`
2. **Review migrations before production**: Check generated SQL files
3. **Use Drizzle Studio**: `npm run db:studio` for database inspection
4. **Keep migrations in version control**: Track all schema changes
5. **Test thoroughly**: Always test migrations in development first

---

For more information, visit the [Drizzle Kit documentation](https://orm.drizzle.team/kit-docs/overview).
